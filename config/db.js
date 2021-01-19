const mongoose = require( 'mongoose' );
mongoose.set( 'useFindAndModify' , false );

const options = {
  keepAlive : true ,
  connectTimeoutMS : 30000 ,
  useNewUrlParser : true ,
  useUnifiedTopology : true
};

class db {
  connect( DB_URL ) {
    const log = console;
    mongoose.connect( DB_URL , options )
      .then( async () => {
        log.info( `Successfully connected to ${ DB_URL }` );
      } )
      .catch( ( err ) => {
        log.error( `There was a db connection error ${ err }` );
        process.exit( 0 );
      } );
    mongoose.set( 'useCreateIndex' , true );
    const db = mongoose.connection;

    db.once( 'disconnected' , () => {
      log.error( `Successfully disconnected from ${ DB_URL }` );
    } );
    process.on( 'SIGINT' , () => {
      mongoose.connection.close( () => {
        log.error( 'dBase connection closed due to app termination' );
        process.exit( 0 );
      } );
    } );
  }
}

module.exports = db;
