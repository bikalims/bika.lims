# -*- coding: utf-8 -*-
#
# This file is part of Bika LIMS
#
# Copyright 2011-2017 by it's authors.
# Some rights reserved. See LICENSE.txt, AUTHORS.txt.

import json
from operator import itemgetter

from zope.interface import implements
from zope.component import getUtility
from plone import protect
from plone.app.content.browser.interfaces import IFolderContentsView
from plone.registry.interfaces import IRegistry

from bika.lims import api
from bika.lims.permissions import ManageAnalysisRequests
from bika.lims.browser.bika_listing import BikaListingView
from bika.lims import bikaMessageFactory as _
from bika.lims.permissions import AddClient
from bika.lims.permissions import ManageClients
from bika.lims.browser import BrowserView


class ClientFolderContentsView(BikaListingView):
    """Listing view for all Clients
    """

    implements(IFolderContentsView)

    def __init__(self, context, request):
        super(ClientFolderContentsView, self).__init__(context, request)
        self.contentFilter = {}
        self.icon = self.portal_url + "/++resource++bika.lims.images/client_big.png"
        self.title = self.context.translate(_("Clients"))
        self.description = ""
        self.show_sort_column = False
        self.show_select_row = False
        self.show_select_all_checkbox = False
        self.show_select_column = False
        self.pagesize = 25
        request.set('disable_border', 1)

        self.columns = {
            'title': {'title': _('Name')},
            'EmailAddress': {'title': _('Email Address')},
            'Phone': {'title': _('Phone')},
            'Fax': {'title': _('Fax')},
            'ClientID': {'title': _('Client ID')},
            'BulkDiscount': {'title': _('Bulk Discount')},
            'MemberDiscountApplies': {'title': _('Member Discount')},
        }

        self.review_states = [  # leave these titles and ids alone
            {
                'id': 'default',
                'contentFilter': {'inactive_state': 'active'},
                'title': _('Active'),
                'transitions': [{'id': 'deactivate'}, ],
                'columns': [
                    'title',
                    'EmailAddress',
                    'Phone',
                    'Fax',
                    'ClientID',
                    'BulkDiscount',
                    'MemberDiscountApplies',
                ]
            }, {
                'id': 'inactive',
                'title': _('Dormant'),
                'contentFilter': {'inactive_state': 'inactive'},
                'transitions': [{'id': 'activate'}, ],
                'columns': [
                    'title',
                    'EmailAddress',
                    'Phone',
                    'Fax',
                    'ClientID',
                    'BulkDiscount',
                    'MemberDiscountApplies',
                ]
            }, {
                'id': 'all',
                'title': _('All'),
                'contentFilter': {},
                'transitions': [],
                'columns': [
                    'title',
                    'EmailAddress',
                    'Phone',
                    'Fax',
                    'ClientID',
                    'BulkDiscount',
                    'MemberDiscountApplies',
                ]
            },
        ]

    def __call__(self):
        self.context_actions = {}
        mtool = api.get_tool('portal_membership')
        if (mtool.checkPermission(AddClient, self.context)):
            self.context_actions[_('Add')] = \
                {'url': 'createObject?type_name=Client',
                 'icon': '++resource++bika.lims.images/add.png'}
        if mtool.checkPermission(ManageClients, self.context):
            self.show_select_column = True
        return super(ClientFolderContentsView, self).__call__()

    def getClientList(self, contentFilter):
        # Only show clients to which we have Manage AR rights.
        # (ritamo only sees Happy Hills).
        searchTerm = self.request.get(self.form_id + '_filter', '').lower()
        mtool = api.get_tool('portal_membership')
        wf = api.get_tool('portal_workflow')
        state = self.request.get('%s_review_state' % self.form_id,
                                 self.default_review_state)
        states = {
            'default': ['active', ],
            'active': ['active', ],
            'inactive': ['inactive', ],
            'all': ['active', 'inactive']
        }

        clients = [cl for cl in self.context.objectValues("Client")
                   if ((cl.Title().lower().find(searchTerm) > -1 or
                        cl.getClientID().lower().find(searchTerm) > -1) and
                       mtool.checkPermission(ManageAnalysisRequests, cl) and
                       wf.getInfoFor(cl, 'inactive_state') in states[state])]

        clients.sort(lambda x, y: cmp(x.Title().lower(), y.Title().lower()))
        return clients

    def folderitems(self):
        self.contentsMethod = self.getClientList
        items = BikaListingView.folderitems(self)
        registry = getUtility(IRegistry)
        if 'bika.lims.client.default_landing_page' in registry:
            landing_page = registry['bika.lims.client.default_landing_page']
        else:
            landing_page = 'analysisrequests'

        for item in items:
            if "obj" not in item:
                continue
            obj = item['obj']

            item['replace']['title'] = "<a href='%s/%s'>%s</a>" % \
                (item['url'], landing_page.encode('ascii'), item['title'])

            item['EmailAddress'] = obj.getEmailAddress()
            item['replace']['EmailAddress'] = "<a href='%s'>%s</a>" % \
                ('mailto:%s' % obj.getEmailAddress(), obj.getEmailAddress())
            item['Phone'] = obj.getPhone()
            item['Fax'] = obj.getFax()
            item['ClientID'] = obj.getClientID()
            item['BulkDiscount'] = obj.getBulkDiscount() and 'Y' or 'N'
            item['MemberDiscountApplies'] = obj.getMemberDiscountApplies() and 'Y' or 'N'

        return items


class ajaxGetClients(BrowserView):
    """Vocabulary source for jquery combo dropdown box
    """

    def __call__(self):
        protect.CheckAuthenticator(self.request)
        searchTerm = self.request.get('searchTerm', '').lower()
        page = self.request.get('page', 1)
        nr_rows = self.request.get('rows', 20)
        sord = self.request.get('sord', 'asc')
        sidx = self.request.get('sidx', '')

        clients = (x.getObject() for x in self.portal_catalog(portal_type="Client",
                                                              inactive_state='active'))
        rows = [{'ClientID': b.getClientID() and b.getClientID() or '',
                 'Title': b.Title(),
                 'ClientUID': b.UID()} for b in clients
                if b.Title().lower().find(searchTerm) > -1 or
                b.getClientID().lower().find(searchTerm) > -1 or
                b.Description().lower().find(searchTerm) > -1]

        rows = sorted(rows, cmp=lambda x, y: cmp(x.lower(), y.lower()), key=itemgetter(sidx and sidx or 'Title'))
        if sord == 'desc':
            rows.reverse()
        pages = len(rows) / int(nr_rows)
        pages += divmod(len(rows), int(nr_rows))[1] and 1 or 0
        ret = {'page': page,
               'total': pages,
               'records': len(rows),
               'rows': rows[(int(page) - 1) * int(nr_rows): int(page) * int(nr_rows)]}

        return json.dumps(ret)
