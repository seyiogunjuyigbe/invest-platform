const createError = require('http-errors');

const endpointsUtil = require('../utils/endpoints');
const http = require('../utils/http');

const {
  FLUTTERWAVE_PUBLIC_KEY,
  FLUTTERWAVE_SECRET_KEY,
  FLUTTERWAVE_BASE_URL,
  FLUTTERWAVE_REDIRECT_URL,
} = process.env;

module.exports = class Flutterwave {
  constructor() {
    this.endpoints = endpointsUtil();

    this.config = {
      publicKey: FLUTTERWAVE_PUBLIC_KEY,
      secretKey: FLUTTERWAVE_SECRET_KEY,
      baseUrl: FLUTTERWAVE_BASE_URL,
    };
  }

  async getAuthUrl(options) {
    const { user, transaction } = options;
    const { amount, reference, currency } = transaction;

    const payload = {
      amount,
      currency,
      tx_ref: reference,
      payment_options: 'card',
      redirect_url: FLUTTERWAVE_REDIRECT_URL,
      customer: {
        email: user.email,
        phonenumber: user.phone,
        name: user.name,
      },
      customizations: {
        title: 'Black Gold Investment Platform',
        description: 'Pay for your Investment',
      },
    };

    return http.post(this.endpoints.raveAuthUrl, payload, {
      Authorization: `Bearer ${this.config.secretKey}`,
    });
  }

  initiate(options) {
    if (options.authType === 'url') {
      return this.getAuthUrl(options);
    }

    const { transaction, paymentType } = options;
    const { amount, reference } = transaction;

    if (paymentType === 'card') {
      return {
        paymentType,
        reference,
        amount,
        key: this.config.publicKey,
        processor: 'flutterwave',
      };
    }
  }

  async getAllBanks(countryCode = 'NG') {
    return http.get(`${this.endpoints.raveListBanks}/${countryCode}`, {
      Authorization: `Bearer ${this.config.secretKey}`,
    });
  }

  async getTransaction(reference) {
    return http.get(
      `${this.endpoints.raveGetTx}`,
      { Authorization: `Bearer ${this.config.secretKey}` },
      { tx_ref: reference }
    );
  }

  async createBeneficiary(payload) {
    return http.post(this.endpoints.raveBeneficiaryUrl, payload, {
      Authorization: `Bearer ${this.config.secretKey}`,
    });
  }

  async transferToBeneficiary(payload) {
    return http.post(this.endpoints.raveTransferUrl, payload, {
      Authorization: `Bearer ${this.config.secretKey}`,
    });
  }

  async validate(options) {
    const payload = {
      PBFPubKey: this.config.publicKey,
      transaction_reference: options.reference,
      otp: options.otp,
    };

    return http.post(this.endpoints.raveValidatePayment, payload);
  }

  async verify(options) {
    const payload = {
      tx_ref: options.paymentRef,
      SECKEY: this.config.secretKey,
    };

    return http.post(this.endpoints.raveVerifyPayment, payload);
  }

  async withdraw(options) {
    const { amountNgn, reference, bankAccount, currency } = options;

    const payload = {
      reference,
      currency,
      amount: amountNgn,
      account_bank: bankAccount.bank.code,
      account_number: bankAccount.number,
      seckey: this.config.secretKey,
      narration: 'Black Gold Investment Payout',
    };

    return http.post(this.endpoints.raveCreateTransfer, payload);
  }

  async getTransfer(options) {
    const params = {
      reference: options.reference,
      seckey: this.config.secretKey,
    };

    return http.get(this.endpoints.raveGetTransfer, params);
  }

  async verifyAccount(options) {
    const url = this.endpoints.verifyAccount;
    const params = {
      recipientaccount: options.bankAccount,
      destbankcode: options.bankCode,
      PBFPubKey: this.config.publicKey,
    };
    const response = await http.post(url, params);

    if (response && response.data) {
      const { status } = response.data;
      const responseCode = response.data.data.responsecode;

      return status === 'success' && responseCode === '00';
    }

    return false;
  }

  isSuccessful({ status }) {
    return status === 'successful';
  }

  async saveTransaction(tnx, calledFrom = 'app') {
    const transaction = tnx;

    function handleError(message) {
      const baseMessage = `Txn Ref: ${transaction.reference}`;
      if (calledFrom === 'app') {
        console.error(`${baseMessage} - ${message}`);
        throw createError(422, message);
      } else {
        console.error(`${baseMessage} - ${message}`);
        throw new Error(calledFrom);
      }
    }

    try {
      const validatedPayment = await this.getTransaction(transaction.reference);

      if (!validatedPayment) {
        handleError('An error occured when validating your payment.');
      }

      if (validatedPayment.status !== 'success') {
        handleError(validatedPayment.message);
      }

      if (
        !validatedPayment.meta ||
        (validatedPayment.meta && !validatedPayment.meta.page_info) ||
        (validatedPayment.meta &&
          validatedPayment.meta.page_info &&
          !validatedPayment.meta.page_info.total)
      ) {
        handleError('Transaction not found');
      }

      if (validatedPayment.data && validatedPayment.data.length) {
        const data = validatedPayment.data[0];
        const paymentRef = data.tx_ref;

        if (data.status === 'success-pending-validation') {
          handleError('Payment is pending validation.');
        }

        if (transaction.reference !== paymentRef) {
          // If references don't match
          handleError(
            'Invalid payment information associated with the reference.'
          );
        }

        const isSuccessful = this.isSuccessful(data);
        const payload = {
          reference: paymentRef,
        };

        if (isSuccessful) {
          const paymentAmt = Number(data.amount);
          const transactionAmt = Number(transaction.amount);

          // Check if amount paid is not less that the expected amount on the bill
          if (paymentAmt < transactionAmt) {
            console.log(
              'email',
              null,
              'Inconsistent amount',
              JSON.stringify({
                paymentAmt,
                transactionAmt,
                transaction,
                data,
              })
            );
            handleError(
              'Amount paid is less than the expected transaction amount.'
            );
          }

          if (transaction.card && !transaction.card.currency) {
            await transaction.card.update({
              currency: transaction.currency,
            });
          }

          const isNewCard = transaction.paymentType === 'newCard';

          if (isNewCard && data.card) {
            const { user } = transaction;
            const card = await user.saveCard(
              transaction.provider,
              data.card,
              transaction.currency
            );
            payload.paymentType = 'card';
            payload.card = card.id;
          } else if (isNewCard && !data.card) {
            payload.paymentType = data.payment_entity || data.paymenttype;
          }

          payload.paymentType =
            data.payment_entity || data.paymenttype || data.payment_type;
          payload.status = 'successful';
        } else {
          console.log('email', null, null, JSON.stringify(validatedPayment));
          payload.status = 'failed';
        }

        const success = await transaction.updateOne(payload);

        if (!success) {
          handleError('An error occured when saving the payment information');
        }

        if (payload.status === 'failed') {
          const message = 'FAILED: Transaction could not be completed.';
          handleError(
            `ID(${transaction.id}) - ${message} - ${
              data.chargemessage || data.gateway_response
            }`
          );
        }

        await transaction.processPayment();

        return true;
      }

      return false;
    } catch (error) {
      console.log(
        'newrelic',
        null,
        'Error saving transactions',
        JSON.stringify(error)
      );

      if (error.message === 'hooks') {
        return;
      }

      if (
        error &&
        error.response &&
        error.response.body &&
        error.response.body.data &&
        error.response.body.data.code &&
        error.response.body.data.code === 'NO TX'
      ) {
        await tnx.update({ status: 'cancelled' });
        throw createError(404, 'No transaction found');
      } else {
        throw error;
      }
    }
  }

  static getInstance() {
    if (!Flutterwave.instance) {
      Flutterwave.instance = new Flutterwave();
      return Flutterwave.instance;
    }

    return Flutterwave.instance;
  }
};
