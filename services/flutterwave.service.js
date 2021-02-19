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
      currency: currency.toUpperCase(),
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
    const {
      amountNgn,
      reference,
      bankAccount,
      currency,
      meta,
      callback_url,
    } = options;
    const payload = {
      reference,
      currency,
      amount: amountNgn,
      account_bank: bankAccount.bankCode,
      account_number: bankAccount.accountNumber,
      narration: 'Black Gold Investment Payout',
      meta,
      callback_url,
    };
    const headers = { Authorization: `Bearer ${this.config.secretKey}` };
    const resp = await http.post(
      this.endpoints.raveCreateTransfer,
      payload,
      headers
    );
    return resp;
  }

  async getTransfer(options) {
    const params = {
      reference: options.reference,
      seckey: this.config.secretKey,
    };

    return http.get(this.endpoints.raveGetTransfer, params);
  }

  async verifyAccount(options) {
    const url = this.endpoints.raveVerifyAccount;
    const params = {
      account_number: options.bankAccount,
      account_bank: options.bankCode,
    };
    try {
      const response = await http.post(url, params, {
        Authorization: `Bearer ${this.config.secretKey}`,
      });
      if (response && response.data) {
        if (response.data.status === 'success' && response.data.data) {
          // account name needed from response
          return response.data.data;
        }
        return false;
      }
    } catch (err) {
      console.log({ err });
      return false;
    }

    return false;
  }

  isSuccessful({ status }) {
    return status === 'successful';
  }

  async verifyTransaction(tnx) {
    const transaction = tnx;

    try {
      const validatedPayment = await this.getTransaction(transaction.reference);

      if (!validatedPayment) {
        throw createError(
          422,
          'An error occured when validating your payment.'
        );
      }

      if (validatedPayment.status !== 'success') {
        throw createError(422, validatedPayment.message);
      }

      if (
        !validatedPayment.meta ||
        (validatedPayment.meta && !validatedPayment.meta.page_info) ||
        (validatedPayment.meta &&
          validatedPayment.meta.page_info &&
          !validatedPayment.meta.page_info.total)
      ) {
        throw createError(404, 'Transaction not found');
      }

      if (validatedPayment.data && validatedPayment.data.length) {
        const data = validatedPayment.data[0];
        const paymentRef = data.tx_ref;

        if (data.status === 'success-pending-validation') {
          throw createError(422, 'Payment is pending validation.');
        }

        if (transaction.reference !== paymentRef) {
          throw createError(
            422,
            'Invalid payment information associated with the reference.'
          );
        }

        return {
          success: this.isSuccessful(data),
          tnx: data,
        };
      }

      return false;
    } catch (error) {
      console.log('Error saving transactions', JSON.stringify(error));

      if (
        error &&
        error.response &&
        error.response.body &&
        error.response.body.data &&
        error.response.body.data.code &&
        error.response.body.data.code === 'NO TX'
      ) {
        await tnx.update({ status: 'cancelled' });
        throw createError(404, 'No transaction record on payment processor');
      } else {
        throw error;
      }
    }
  }

  async verifyBvn(bvn) {
    try {
      const url = `${this.endpoints.raveValidateBvn}/${bvn}`;
      const headers = {
        Authorization: `Bearer ${this.config.secretKey}`,
      };
      const response = await http.get(url, headers);
      if (response && response.data) {
        return response.data.status === 'success' ? response.data : false;
      }
      return false;
    } catch (error) {
      return false;
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
