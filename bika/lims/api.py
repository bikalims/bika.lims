# -*- coding: utf-8 -*-
#
# Bika LIMS Framwork API

from Acquisition import aq_base
from AccessControl.PermissionRole import rolesForPermissionOn

from Products.CMFCore.interfaces import ISiteRoot
from Products.Archetypes.BaseObject import BaseObject
from Products.ZCatalog.interfaces import ICatalogBrain
from Products.CMFCore.WorkflowCore import WorkflowException

from zope import globalrequest
from zope.lifecycleevent import modified
from zope.component import getMultiAdapter
from zope.security.interfaces import Unauthorized

from plone import api as ploneapi
from plone.api.exc import InvalidParameterError
from plone.dexterity.interfaces import IDexterityContent
from plone.app.layout.viewlets.content import ContentHistoryView

# from bika.lims import logger

"""Please see bika.lims/docs/API.rst for documentation
"""

_marker = object()


class BikaLIMSError(Exception):
    """Base exception class for bika.lims errors."""


def get_portal():
    """Get the portal object

    :returns: Portal object
    :rtype: object
    """
    return ploneapi.portal.getSite()


def get_bika_setup():
    """Fetch the `bika_setup` folder.
    """
    portal = get_portal()
    return portal.get("bika_setup")


def create(container, portal_type, title=None, **kwargs):
    """Creates an object in Bika LIMS

    :param container: container
    :type container: ATContentType/DexterityContentType/CatalogBrain
    :param portal_type: The portal type to create, e.g. "Client"
    :type portal_type: string
    :param title: The title for the new content object
    :type title: string
    :returns: The new created object
    :rtype: object
    """

    title = title is None and "Test {}".format(portal_type) or title
    _ = container.invokeFactory(portal_type, id="tmpID", title=title)
    obj = container.get(_)
    obj.processForm()
    # explicit notification
    modified(obj)
    return obj


def get_tool(name, default=_marker):
    """Get a portal tool by name

    :param name: The name of the tool, e.g. `portal_catalog`
    :type name: string
    :returns: Portal Tool
    :rtype: object
    """
    try:
        return ploneapi.portal.get_tool(name)
    except InvalidParameterError:
        if default is not _marker:
            return default
        fail("No tool named '%s' found." % name)


def fail(msg=None):
    """Bika LIMS Error
    """
    if msg is None:
        msg = "Reason not given."
    raise BikaLIMSError("{0}".format(msg))


def get_object(brain_or_object):
    """Get the full content object

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: PortalObject/ATContentType/DexterityContentType/CatalogBrain
    :returns: The full object
    :rtype: object
    """

    if is_portal(brain_or_object):
        return brain_or_object
    if is_brain(brain_or_object):
        return brain_or_object.getObject()
    if is_at_content(brain_or_object):
        return brain_or_object
    if is_dexterity_content(brain_or_object):
        return brain_or_object
    fail("%r is not supported." % brain_or_object)


def is_portal(brain_or_object):
    """Checks if the passed in object is the portal root object

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: True if the object is the portal root object
    :rtype: bool
    """
    return ISiteRoot.providedBy(brain_or_object)


def is_brain(brain_or_object):
    """Checks if the passed in object is a portal catalog brain

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: True if the object is a catalog brain
    :rtype: bool
    """
    return ICatalogBrain.providedBy(brain_or_object)


def is_dexterity_content(brain_or_object):
    """Checks if the passed in object is a dexterity content type

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: True if the object is a dexterity content type
    :rtype: bool
    """
    return IDexterityContent.providedBy(brain_or_object)


def is_at_content(brain_or_object):
    """Checks if the passed in object is an AT content type

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: True if the object is an AT content type
    :rtype: bool
    """
    return isinstance(brain_or_object, BaseObject)


def get_schema(brain_or_object):
    """Get the schema of the content

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: Schema object
    :rtype: object
    """
    obj = get_object(brain_or_object)
    if is_portal(obj):
        return None
    if is_dexterity_content(obj):
        pt = get_portal_catalog()
        fti = pt.getTypeInfo(obj.portal_type)
        return fti.lookupSchema()
    if is_at_content(obj):
        return obj.Schema()
    fail("%r has no Schema.")


def get_fields(brain_or_object):
    """Get the list of fields from the object

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: List of fields
    :rtype: list
    """
    obj = get_object(brain_or_object)
    schema = get_schema(obj)
    if not schema:
        return {}
    if is_dexterity_content(obj):
        # XXX implement properly for Dexterity content types
        return dict.fromkeys(schema.names())
    return dict(zip(schema.keys(), schema.fields()))


def get_id(brain_or_object):
    """Get the Plone ID for this object

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: Plone ID
    :rtype: string
    """
    if is_brain(brain_or_object):
        return brain_or_object.getId
    return get_object(brain_or_object).getId()


def get_uid(brain_or_object):
    """Get the Plone UID for this object

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: Plone UID
    :rtype: string
    """
    if is_portal(brain_or_object):
        return 0
    if is_brain(brain_or_object):
        return brain_or_object.UID
    return get_object(brain_or_object).UID()


def get_object_by_uid(uid):
    """Find an object by a given UID

    :param uid: The UID of the object to find
    :type uid: string
    :returns: Found Object or None
    :rtype: object
    """

    # nothing to do here
    if uid is None:
        return None

    # we defined the portal object UID to be 0::
    if uid == 0:
        return get_portal()

    # we try to find the object with both catalogs
    pc = get_portal_catalog()
    rc = get_tool("reference_catalog", None)

    # try to find the object with the reference catalog first
    obj = rc and rc.lookupObject(uid)
    if obj:
        return obj

    # try to find the object with the portal catalog
    res = pc(dict(UID=uid))
    if len(res) > 1:
        fail("More than one object found for UID '%s'" % uid)
        return None
    if not res:
        return None

    return get_object(res[0])


def get_object_by_path(path):
    """Find an object by a given physical path

    :param path: The physical path of the object to find
    :type path: string
    :returns: Found Object or None
    :rtype: object
    """

    # nothing to do here
    if not path:
        return None

    pc = get_portal_catalog()
    portal = get_portal()
    portal_path = get_path(portal)

    if not path.startswith(portal_path):
        fail("Not a physical path inside the portal.")

    if path == portal_path:
        return portal

    res = pc(path=dict(query=path, depth=0))
    if not res:
        return None
    return get_object(res[0])


def get_path(brain_or_object):
    """Calculate the physical path of this object

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: Physical path of the object
    :rtype: string
    """
    if is_brain(brain_or_object):
        return brain_or_object.getPath()
    return "/".join(get_object(brain_or_object).getPhysicalPath())


def get_parent_path(brain_or_object):
    """Calculate the physical parent path of this object

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: Physical path of the parent object
    :rtype: string
    """
    if is_portal(brain_or_object):
        return get_path(get_portal())
    if is_brain(brain_or_object):
        path = get_path(brain_or_object)
        return path.rpartition("/")[0]
    return get_path(get_object(brain_or_object).aq_parent)


def get_parent(brain_or_object):
    """Locate the parent object of the content/catalog brain

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: parent object
    :rtype: ATContentType/DexterityContentType/PloneSite/CatalogBrain
    """

    if is_portal(brain_or_object):
        return get_portal()

    if is_brain(brain_or_object):
        parent_path = get_parent_path(brain_or_object)

        # parent is the portal object
        if parent_path == get_path(get_portal()):
            return get_portal()

        # query for the parent path
        pc = get_portal_catalog()
        results = pc(path={
            "query": parent_path,
            "depth": 0})

        # fallback to the object
        if not results:
            return get_object(brain_or_object).aq_parent
        # return the brain
        return results[0]

    return get_object(brain_or_object).aq_parent


def search(query, catalog=_marker):
    """Search for objects.

    :param query: A suitable search query.
    :type query: dict
    :param catalog: A named catalog tool
    :type catalog: str
    :returns: Search results
    :rtype: List of ZCatalog brains
    """

    # query needs to be a dictionary
    if not isinstance(query, dict):
        fail("Catalog query needs to be a dictionary")

    # The user requested an explicit catalog query.
    # Fetch the catalog and execute the query
    if catalog is not _marker:
        tool = get_tool(catalog)
        return tool(**query)

    # Implicit queries require knowledge about the `portal_type` to search.
    portal_types = query.get("portal_type", None)

    # If no portal_type was found, execute a standard catalog search
    if portal_types is None:
        return get_portal_catalog()(query)

    # We want the portal_type as a list
    if not isinstance(portal_types, (tuple, list)):
        portal_types = [portal_types]

    # The catalogs to query
    catalogs = []

    # Use the archetypes_tool to gather the right catalogs
    archetype_tool = get_tool("archetype_tool", None)
    if archetype_tool:
        for portal_type in portal_types:
            # we just want the first of the registered catalogs
            catalogs.extend(archetype_tool.getCatalogsByType(portal_type)[:1])
        # avoid duplicate catalogs
        catalogs = list(set(catalogs))

    # gracefully fall-back to the `portal_catalog`
    if not catalogs:
        catalogs = [get_portal_catalog()]

    # With a single catalog, we don't have to care about merging the results
    if len(catalogs) == 1:
        return catalogs[0](query)

    # Multiple catalog results need to be merged
    results = dict()
    for catalog in catalogs:
        for brain in catalog(query):
            # Avoid duplicates
            results[brain.UID] = brain

    # The search results of all catalog queries are now mixed, so we have to
    # order them according to the search spec
    search_results = results.values()

    # Handle the `limit`, `sort_order` and the `sort_on` manually
    limit = query.get("limit")
    sort_on = query.get("sort_on", "created")
    sort_order = query.get("sort_order", "ascending")

    def _sort_on(x, y):
        x = safe_getattr(x, sort_on, x)
        y = safe_getattr(y, sort_on, y)
        # we can only compare objects of the same type
        if type(x) != type(y):
            return 0
        return cmp(x, y)

    # sort according to the `sort_on` and `sort_order`
    reverse = sort_order in ["descending", "reverse"] and True or False
    search_results = sorted(search_results, cmp=_sort_on, reverse=reverse)
    # check for a search limit
    if limit:
        return search_results[:int(limit)]
    return search_results


def safe_getattr(brain_or_object, attr, default=_marker):
    """Return the attribute value

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :param attr: Attribute name
    :type attr: str
    :returns: Attribute value
    :rtype: obj
    """
    try:
        value = getattr(brain_or_object, attr, _marker)
        if value is _marker:
            if default is not _marker:
                return default
            fail("Attribute '{}' not found.".format(attr))
        if callable(value):
            return value()
        return value
    except Unauthorized:
        if default is not _marker:
            return default
        fail("You are not authorized to access '{}' of '{}'.".format(
            attr, repr(brain_or_object)))


def get_portal_catalog():
    """Get the portal catalog tool

    :returns: Portal Catalog Tool
    :rtype: object
    """
    return get_tool("portal_catalog")


def get_review_history(brain_or_object, rev=True):
    """Get the review history for the given brain or context.

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: Workflow history
    :rtype: obj
    """
    obj = get_object(brain_or_object)
    review_history = []
    try:
        workflow = get_tool("portal_workflow")
        review_history = workflow.getInfoFor(obj, 'review_history')
    except WorkflowException:
        return []
    if rev is True:
        review_history = reversed(review_history)
    if not isinstance(review_history, (list, tuple)):
        return list(review_history)
    return review_history


def get_revision_history(brain_or_object):
    """Get the revision history for the given brain or context.

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: Workflow history
    :rtype: obj
    """
    obj = get_object(brain_or_object)
    chv = ContentHistoryView(obj, safe_getattr(obj, "REQUEST", None))
    return chv.fullHistory()


def get_workflows_for(brain_or_object):
    """Get the assigned workflows for the given brain or context.

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: Assigned Workflows
    :rtype: tuple
    """
    obj = get_object(brain_or_object)
    workflow = ploneapi.portal.get_tool("portal_workflow")
    return workflow.getChainFor(obj)


def get_workflow_status_of(brain_or_object):
    """Get the current workflow status of the given brain or context.

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: Status
    :rtype: str
    """
    obj = get_object(brain_or_object)
    return ploneapi.content.get_state(obj)


def get_roles_for_permission(permission, brain_or_object):
    """Get a list of granted roles for the given permission on the object.

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: Roles for the given Permission
    :rtype: list
    """
    obj = get_object(brain_or_object)
    allowed = set(rolesForPermissionOn(permission, obj))
    return sorted(allowed)


def is_versionable(brain_or_object, policy='at_edit_autoversion'):
    """Checks if the passed in object is versionable.

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: True if the object is versionable
    :rtype: bool
    """
    pr = get_tool("portal_repository")
    obj = get_object(brain_or_object)
    return pr.supportsPolicy(obj, 'at_edit_autoversion') and pr.isVersionable(obj)


def get_version(brain_or_object):
    """Get the version of the current object

    :param brain_or_object: A single catalog brain or content object
    :type brain_or_object: ATContentType/DexterityContentType/CatalogBrain
    :returns: The current version of the object
    :rtype: int
    """
    obj = get_object(brain_or_object)
    if not is_versionable(obj):
        return None
    return getattr(aq_base(obj), "version_id", 0)


def get_view(name, context=None, request=None):
    """Get the view by name

    :param name: The name of the view
    :type name: str
    :param context: The context to query the view
    :type context: ATContentType/DexterityContentType/CatalogBrain
    :param request: The request to query the view
    :type request: HTTPRequest object
    :returns: HTTP Request
    :rtype: Products.Five.metaclass View object
    """
    context = context or get_portal()
    request = request or get_request() or None
    return getMultiAdapter((get_object(context), request), name=name)


def get_request():
    """Get the global request object

    :returns: HTTP Request
    :rtype: HTTPRequest object
    """
    return globalrequest.getRequest()


def get_group(group_or_groupname):
    """Return Plone Group

    :param group_or_groupname: Plone group or the name of the group
    :type groupname:  GroupData/str
    :returns: Plone GroupData
    :rtype: object
    """
    if not group_or_groupname:
        return None
    if hasattr(group_or_groupname, "_getGroup"):
        return group_or_groupname
    gtool = get_tool("portal_groups")
    return gtool.getGroupById(group_or_groupname)


def get_user(user_or_username):
    """Return Plone User

    :param user_or_username: Plone user or user id
    :type groupname:  PloneUser/MemberData/str
    :returns: Plone MemberData
    :rtype: object
    """
    if not user_or_username:
        return None
    if hasattr(user_or_username, "getUserId"):
        return ploneapi.user.get(user_or_username.getUserId())
    return ploneapi.user.get(userid=user_or_username)


def get_user_properties(user_or_username):
    """Return User Properties

    :param user_or_username: Plone group identifier
    :type groupname:  PloneUser/MemberData/str
    :returns: Plone MemberData
    :rtype: object
    """
    user = get_user(user_or_username)
    if user is None:
        return {}
    if not callable(user.getUser):
        return {}
    out = {}
    plone_user = user.getUser()
    for sheet in plone_user.listPropertysheets():
        ps = plone_user.getPropertysheet(sheet)
        out.update(dict(ps.propertyItems()))
    return out


def get_users_by_roles(roles=None):
    """Search Plone users by their roles

    :param roles: Plone role name or list of roles
    :type roles:  list/str
    :returns: List of Plone users having the role(s)
    :rtype: object
    """
    if not isinstance(roles, (tuple, list)):
        roles = [roles]
    mtool = get_tool("portal_membership")
    return mtool.searchForMembers(roles=roles)


def get_current_user():
    """Returns the current logged in user

    :returns: Current User
    :rtype: object
    """
    return ploneapi.user.get_current()
