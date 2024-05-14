<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 px-0 mb-4">
			<form role="form" class="registration-notification-settings">
				<div class="mb-3 col-sm-6">
					<label for="method" class="form-label">How do you wish to be notified of a new registration?</label>
					<select id="method" name="method" class="form-control" multiple="multiple">
						<option value="notification">Notification</option>
						<option value="email">Email</option>
					</select>
				</div>
				<div class="col-sm-6">
					<label for="registerType" class="form-label">Which register types do you want to be notified of?</label>
					<select id="registerType" name="registerType" class="form-control" multiple="multiple">
						<option value="all">All</option>
						<option value="normal">Normal</option>
						<option value="invite-only">Invite Only</option>
						<option value="admin-invite-only">Admin Invite Only</option>
					</select>
				</div>
			</form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>

