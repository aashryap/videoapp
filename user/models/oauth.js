var mongoose = require('mongoose'),
Schema = mongoose.Schema,
model = module.exports,
// User = require('../models/user'),
db = require("../models/index");
_ = require('underscore'),
  bcrypt = require('bcryptjs');

//
// Schemas definitions
//
var OAuthAccessTokensSchema = new Schema({
accessToken: {
  type: String
},
clientId: {
  type: String
},
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'user'
},
expires: {
  type: Date
},
  scope:{
  type: String
  }
});

var OAuthRefreshTokensSchema = new Schema({
refreshToken: {
  type: String
},
clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OAuthClients'
},
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'user'
},
expires: {
  type: Date
},
  scope:{
  type:String
  }
});

var OAuthClientsSchema = new Schema({
clientId: {
  type: String
},
clientSecret: {
  type: String
},
redirectUri: {
  type: String
}
});


var OAuthScopeSchema = new Schema({
  scope:  String,
  is_default: Boolean
});

mongoose.model('OAuthAccessTokens', OAuthAccessTokensSchema);
mongoose.model('OAuthRefreshTokens', OAuthRefreshTokensSchema);
mongoose.model('OAuthClients', OAuthClientsSchema);
mongoose.model('OAuthScope', OAuthScopeSchema);


var OAuthAccessTokensModel = mongoose.model('OAuthAccessTokens'),
OAuthRefreshTokensModel = mongoose.model('OAuthRefreshTokens'),
OAuthClientsModel = mongoose.model('OAuthClients'),
OAuthScopeSchema =  mongoose.model('OAuthScope'),

OAuthUsersModel = db['user'];


model.getAccessToken = function (bearerToken) {
  console.log("getAccessToken",bearerToken);
  return OAuthAccessTokensModel
  //User,OAuthClient
      .findOne({accessToken: bearerToken})
      .populate('user')
      // .populate('OAuthClient')
      .then(function (accessToken) {
          console.log('***************************************access token************************************',accessToken);
          if (!accessToken) return false;
          var token = accessToken;
          token.user = token.user;
          token.client = token.clientId;
          token.scope = token.scope;
          token.accessTokenExpiresAt = token.expires;
          return token;
      })
      .catch(function (err) {
        console.log("getAccessToken - Err: ")
    });

    
      
}



model.getClient = function (clientId, clientSecret) {
  console.log("getClient",clientId, clientSecret);
  const options = {clientId: clientId};
  if (clientSecret) options.clientSecret = clientSecret;

  return OAuthClientsModel
      .findOne(options)
      .then(function (client) {
          if (!client) return new Error("client not found");
          var clientWithGrants = client;
          clientWithGrants.grants = ['authorization_code', 'password', 'refresh_token', 'client_credentials']
          // Todo: need to create another table for redirect URIs
          // clientWithGrants.redirectUris = [clientWithGrants.redirect_uri]
          // delete clientWithGrants.redirect_uri
          //clientWithGrants.refreshTokenLifetime = integer optional
          //clientWithGrants.accessTokenLifetime  = integer optional
          return clientWithGrants
      }).catch(function (err) {
          console.log("getClient - Err: ", err)
      });
};

// This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
// it gives an example of how to use the method to resrict certain grant types
// var authorizedClientIds = ['DEMO'];

/*model.grantTypeAllowed = function(clientId, grantType, callback) {
console.log('in grantTypeAllowed (clientId: ' + clientId + ', grantType: ' + grantType + ')');

if (grantType === 'password') {
  return callback(false, authorizedClientIds.indexOf(clientId) >= 0);
}

callback(false, true);
};*/



model.saveToken = function (token, client, user) {
  console.log("saveToken user _______________________________", user);
  console.log("saveToken client _______________________________", client);

  OAuthAccessTokensModel.findOneAndRemove({user:user._id}).then(function (result) {
      console.log('old access token hasbeen deleted')
  }).catch(function (err) {
      console.log(err)
  })

  OAuthRefreshTokensModel.findOneAndRemove({user:user._id}).then(function (result) {
      console.log('old rfresh token has bean removed')
  }).catch(function (err) {
      console.log(err)
  })

  return Promise.all([
      OAuthAccessTokensModel.create({
          accessToken: token.accessToken,
          expires: token.accessTokenExpiresAt,
          clientId: client._id,
          user: user._id,
          scope: token.scope
      }),
      token.refreshToken ? OAuthRefreshTokensModel.create({ // no refresh token for client_credentials
          refreshToken: token.refreshToken,
          expires: token.refreshTokenExpiresAt,
          clientId: client._id,
          user: user._id,
          scope: token.scope
      }) : [],

  ])
      .then(function (resultsArray) {
          return _.assign(  // expected to return client and user, but not returning
              {
                  client: client,
                  user: user,
                  accessToken: token.accessToken, // proxy
                  refreshToken: token.refreshToken, // proxy
              },
              token
          )
      })
      .catch(function (err) {
          console.log("revokeToken - Err: ", err)
      });
};

/*
* Required to support password grant type
*/
model.getUser = function(username, password, callback) {
console.log('in getUser (username: ' + username.toLowerCase() + ', password: ' + password + ')');
console.log(username);
OAuthUsersModel.findOne({
  email: username.toLowerCase()
}, '+password', function(err, user) {
  if (err) return callback(err);
  if (user === null) return callback(err);

  user.comparePassword(password, function(err, isMatch) {
    if (isMatch === true) {
      console.log('USER **************** ' + user);
      callback(null, user);
    } else {
      return callback(err);
    }
  });

});
};


/*model.getRefreshToken = function (refreshToken) {
  console.log("getRefreshToken", refreshToken)
  if (!refreshToken || refreshToken === 'undefined') return false
//[OAuthClient, User]
  return OAuthRefreshTokensModel
      .findOne({refreshToken: refreshToken})
      .populate('user')
      // .populate('OAuthClient')
      .then(function (savedRT) {
          console.log("srt",savedRT)
          var tokenTemp = {
              user: savedRT ? savedRT.user : {},
              client: savedRT ? savedRT.clientId : {},
              refreshTokenExpiresAt: savedRT ? new Date(savedRT.expires) : null,
              refreshToken: refreshToken,
              refresh_token: refreshToken,
              scope: savedRT.scope
          };
          return tokenTemp;

      }).catch(function (err) {
          console.log("getRefreshToken - Err: ", err)
      });
};*/


model.getRefreshToken = function (refreshToken) {
  console.log("getRefreshToken", refreshToken);
  if (!refreshToken || refreshToken === 'undefined') return false;

  return OAuthRefreshTokensModel
      .findOne({refreshToken: refreshToken})
      .populate('user')
      .populate('clientId')
      .then(function (savedRT) {
          console.log("srt",savedRT);
          // OAuthClientsModel.findOne({_id:savedRT.clientId}).then(function (client) {
           // console.log(client)
          OAuthRefreshTokensModel.findOneAndRemove({refreshToken: refreshToken}).then(function (refresh) {
              console.log('old refresh token has been removed_______', refresh)
          }).catch(function (err) {
              console.log(err)
          })
          var tokenTemp = {
              user: savedRT ? savedRT.user : {},
              client: savedRT ? savedRT.clientId : {},
              refreshTokenExpiresAt: savedRT ? new Date(savedRT.expires) : null,
              refreshToken: refreshToken,
              refresh_token: refreshToken,
              scope: savedRT.scope
          };

          //console.log(tokenTemp)
          return tokenTemp;
          // }).catch(function (err) {
          //     console.log(err)
          // })
      }).catch(function (err) {
          console.log("getRefreshToken - Err: ", err)
      });
};


model.validateScope = function (token, client, scope) {
  console.log("validateScope", token, client, scope);
  if (token.scope.indexOf(scope) > -1){
      return scope;
  }else{
      return false;
  }
  // return (user.scope === client.scope) ? scope : false
};

model.verifyScope = function (token, scope) {
  console.log("verifyScope", token, scope);

  if (token.scope.indexOf(scope) > -1){
      return true;
  }else{
      return false;
  }
  // return token.scope === scope
};

model.revokeToken = function (token) {
  console.log("revokeToken",token);
  return OAuthRefreshTokensModel.findOne({
      where: {
          refreshToken: token.refreshToken
      }
  }).then(function (rT) {
      if (rT) rT.destroy();
      /***
       * As per the discussion we need set older date
       * revokeToken will expected return a boolean in future version
       * https://github.com/oauthjs/node-oauth2-server/pull/274
       * https://github.com/oauthjs/node-oauth2-server/issues/290
       */
      var expiredToken = token;
      expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z');
      return expiredToken
  }).catch(function (err) {
      console.log("revokeToken - Err: ", err)
  });
};

// model.revokeRefreshToken = function (refreshToken, callback){
//   console.log('in revoke token' + refreshToken);
//     OAuthRefreshTokensModel.findOne({
//         refreshToken: refreshToken
//     }, callback);
//
// };

module.exports.OAuthClientsModel = OAuthClientsModel;