# -*- coding: utf-8 -*-
#
# This file is part of Bika LIMS
#
# Copyright 2011-2017 by it's authors.
# Some rights reserved. See LICENSE.txt, AUTHORS.txt.

from plone import api

import re
from Products.CMFPlone.utils import safe_unicode
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile
from plone.app.controlpanel.usergroups import UsersOverviewControlPanel
from plone.protect import CheckAuthenticator

from bika.lims import PMF
from bika.lims import bikaMessageFactory as _
from bika.lims import logger
from bika.lims.browser import BrowserView
from bika.lims.content.contact import Contact
from bika.lims.content.labcontact import LabContact


class ContactLoginDetailsView(BrowserView):
    """Contact Login View
    """
    template = ViewPageTemplateFile("templates/login_details.pt")

    def __call__(self):
        request = self.request
        form = request.form
        CheckAuthenticator(form)

        self.newSearch = False
        self.searchstring = form.get("searchstring", "")

        if form.get("submitted"):
            logger.debug("Form Submitted: {}".format(form))
            if form.get("unlink_button", False):
                self._unlink_user()
            elif form.get("delete_button", False):
                self._unlink_user(delete=True)
            elif form.get("search_button", False):
                logger.debug("Search User")
                self.newSearch = True
            elif form.get("link_button", False):
                logger.debug("Link User")
                self._link_user(form.get("userid"))
            elif form.get("save_button", False):
                logger.debug("Create User")
                self._create_user()

        return self.template()

    def get_user_properties(self):
        """Return the properties of the User
        """

        user = self.context.getUser()

        # No User linked, nothing to do
        if user is None:
            return {}

        out = {}
        plone_user = user.getUser()
        userid = plone_user.getId()
        for sheet in plone_user.listPropertysheets():
            ps = plone_user.getPropertysheet(sheet)
            out.update(dict(ps.propertyItems()))

        portal = api.portal.get()
        mtool = api.portal.get_tool(name='portal_membership')

        out["id"] = userid
        out["portrait"] = mtool.getPersonalPortrait(id=userid)
        out["edit_url"] = "{}/@@user-information?userid={}".format(
            portal.absolute_url(), userid)

        return out

    def get_contact_properties(self):
        """Return the properties of the Contact
        """
        contact = self.context

        return {
            "fullname": contact.getFullname(),
            "username": contact.getUsername(),
        }

    def linkable_users(self):
        """Search Plone users which are not linked to a contact
        """

        # We make use of the existing controlpanel `@@usergroup-userprefs` view
        # logic to make sure we get all users from all plugins (e.g. LDAP)
        users_view = UsersOverviewControlPanel(self.context, self.request)

        users = users_view.doSearch("")

        out = []
        for user in users:
            userid = user.get("id", None)

            if userid is None:
                continue

            # Skip users which are already linked to a Contact
            contact = Contact.getContactByUsername(userid)
            labcontact = LabContact.getContactByUsername(userid)

            if contact or labcontact:
                continue

            userdata = {
                "userid": userid,
                "email": user.get("email"),
                "fullname": user.get("title"),
            }

            # filter out users which do not match the searchstring
            if self.searchstring:
                s = self.searchstring.lower()
                if not any(map(lambda v: re.search(s, str(v).lower()), userdata.values())):
                    continue

            # update data (maybe for later use)
            userdata.update(user)

            # Append the userdata for the results
            out.append(userdata)

        out.sort(lambda x, y: cmp(x["fullname"], y["fullname"]))
        return out

    def is_contact(self):
        """Check if the current context is a Contact
        """
        if self.context.portal_type == "Contact":
            return True
        return False

    def is_labcontact(self):
        """Check if the current context is a LabContact
        """
        if self.context.portal_type == "LabContact":
            return True
        return False

    def _link_user(self, userid):
        """Link an existing user to the current Contact
        """
        # check if we have a selected user from the search-list
        if userid:
            try:
                self.context.setUser(userid)
                self.add_status_message(_("User linked to this Contact"), "info")
            except ValueError, e:
                self.add_status_message(e, "error")
        else:
            self.add_status_message(_("Please select a User from the list"), "info")

    def _unlink_user(self, delete=False):
        """Unlink and delete the User from the current Contact
        """
        if delete:
            self.add_status_message(_("Unlinked and deleted User"), "warning")
            self.context.unlinkUser(delete=True)
        else:
            self.add_status_message(_("Unlinked User"), "info")
            self.context.unlinkUser()

    def add_status_message(self, message, severity="info"):
        """Set a portal message
        """
        self.context.plone_utils.addPortalMessage(message, severity)

    def _create_user(self):
        """Create a new user
        """

        def error(field, message):
            if field:
                message = "%s: %s" % (field, message)
            self.context.plone_utils.addPortalMessage(message, 'error')
            return self.request.response.redirect(self.context.absolute_url() + "/login_details")

        form = self.request.form
        contact = self.context

        password = safe_unicode(form.get('password', '')).encode('utf-8')
        username = safe_unicode(form.get('username', '')).encode('utf-8')
        confirm = form.get('confirm', '')
        email = safe_unicode(form.get('email', '')).encode('utf-8')

        if not username:
            return error('username', PMF("Input is required but not given."))

        if not email:
            return error('email', PMF("Input is required but not given."))

        reg_tool = self.context.portal_registration
        properties = self.context.portal_properties.site_properties

        # if properties.validate_email:
        #     password = reg_tool.generatePassword()
        # else:
        if password != confirm:
            return error('password', PMF("Passwords do not match."))

        if not password:
            return error('password', PMF("Input is required but not given."))

        if not confirm:
            return error('password', PMF("Passwords do not match."))

        if len(password) < 5:
            return error('password', PMF("Passwords must contain at least 5 letters."))

        try:
            reg_tool.addMember(username,
                               password,
                               properties={
                                   'username': username,
                                   'email': email,
                                   'fullname': username})
        except ValueError, msg:
            return error(None, msg)

        contact.setUser(username)

        # Additional groups for LabContact users.
        # not required (not available for client Contact)
        if 'groups' in self.request and self.request['groups']:
            groups = self.request['groups']
            if not type(groups) in (list, tuple):
                groups = [groups, ]
            for group in groups:
                group = self.portal_groups.getGroupById(group)
                group.addMember(username)

        contact.reindexObject()

        if properties.validate_email or self.request.get('mail_me', 0):
            try:
                reg_tool.registeredNotify(username)
            except:
                import transaction
                transaction.abort()
                message = _("SMTP server disconnected. User creation aborted.")
                return error(None, message)

        message = _("Member registered and linked to the current Contact.")
        self.context.plone_utils.addPortalMessage(message, 'info')
        return self.request.response.redirect(self.context.absolute_url() + "/login_details")

    def tabindex(self):
        i = 0
        while True:
            i += 1
            yield i
