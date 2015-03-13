'use strict';
/* globals define, $, app, socket, require */

define('admin/plugins/registration-notification', ['settings'], function(Settings) {
	var ACP = {};

	ACP.init = function() {
		Settings.load('registration-notification', $('.registration-notification-settings'));

		$('#save').on('click', function() {
			Settings.save('registration-notification', $('.registration-notification-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'registration-notification-saved',
					title: 'Settings Saved'/*,
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}*/
				});
			});
		});
	};

	return ACP;
});