'use strict';

var plugins = require.main.require('./src/plugins'),

	Controllers = {};

Controllers.renderAdminPage = function (req, res, next) {
	res.render('admin/plugins/registration-notification', {
		hasEmailer: plugins.hasListeners('filter:email.send')
	});
};

module.exports = Controllers;
