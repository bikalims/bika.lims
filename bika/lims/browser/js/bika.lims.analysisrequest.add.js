
/* Please use this command to compile this file into the parent `js` directory:
    coffee --no-header -w -o ../ -c bika.lims.analysisrequest.add.coffee
 */

(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    hasProp = {}.hasOwnProperty;

  window.AnalysisRequestAdd = (function() {
    function AnalysisRequestAdd() {
      this.on_form_submit = bind(this.on_form_submit, this);
      this.on_ajax_end = bind(this.on_ajax_end, this);
      this.on_ajax_start = bind(this.on_ajax_start, this);
      this.ajax_post_form = bind(this.ajax_post_form, this);
      this.on_copy_button_click = bind(this.on_copy_button_click, this);
      this.on_service_category_click = bind(this.on_service_category_click, this);
      this.on_service_listing_header_click = bind(this.on_service_listing_header_click, this);
      this.on_reportdrymatter_click = bind(this.on_reportdrymatter_click, this);
      this.on_analysis_checkbox_click = bind(this.on_analysis_checkbox_click, this);
      this.on_analysis_profile_removed = bind(this.on_analysis_profile_removed, this);
      this.on_analysis_profile_selected = bind(this.on_analysis_profile_selected, this);
      this.on_analysis_template_changed = bind(this.on_analysis_template_changed, this);
      this.on_specification_changed = bind(this.on_specification_changed, this);
      this.on_sampletype_changed = bind(this.on_sampletype_changed, this);
      this.on_sample_changed = bind(this.on_sample_changed, this);
      this.on_analysis_lock_button_click = bind(this.on_analysis_lock_button_click, this);
      this.on_analysis_details_click = bind(this.on_analysis_details_click, this);
      this.on_analysis_specification_changed = bind(this.on_analysis_specification_changed, this);
      this.on_client_changed = bind(this.on_client_changed, this);
      this.hide_all_service_info = bind(this.hide_all_service_info, this);
      this.get_service = bind(this.get_service, this);
      this.set_service_spec = bind(this.set_service_spec, this);
      this.set_service = bind(this.set_service, this);
      this.set_template = bind(this.set_template, this);
      this.set_sampletype = bind(this.set_sampletype, this);
      this.set_sample = bind(this.set_sample, this);
      this.set_client = bind(this.set_client, this);
      this.set_reference_field = bind(this.set_reference_field, this);
      this.set_reference_field_query = bind(this.set_reference_field_query, this);
      this.get_field_by_id = bind(this.get_field_by_id, this);
      this.get_fields = bind(this.get_fields, this);
      this.get_form = bind(this.get_form, this);
      this.get_authenticator = bind(this.get_authenticator, this);
      this.get_base_url = bind(this.get_base_url, this);
      this.get_portal_url = bind(this.get_portal_url, this);
      this.update_form = bind(this.update_form, this);
      this.recalculate_prices = bind(this.recalculate_prices, this);
      this.recalculate_records = bind(this.recalculate_records, this);
      this.render_template = bind(this.render_template, this);
      this.template_dialog = bind(this.template_dialog, this);
      this.bind_eventhandler = bind(this.bind_eventhandler, this);
      this.load = bind(this.load, this);
    }

    AnalysisRequestAdd.prototype.load = function() {
      console.debug("AnalysisRequestAdd::load");
      jarn.i18n.loadCatalog('bika');
      this._ = window.jarn.i18n.MessageFactory('bika');
      $('input[type=text]').prop('autocomplete', 'off');
      this.records_snapshot = {};
      $(".blurrable").removeClass("blurrable");
      this.bind_eventhandler();
      return this.recalculate_records();
    };


    /* METHODS */

    AnalysisRequestAdd.prototype.bind_eventhandler = function() {

      /*
       * Binds callbacks on elements
       */
      console.debug("AnalysisRequestAdd::bind_eventhandler");
      $(".service-listing-header").on("click", this.on_service_listing_header_click);
      $("tr.category").on("click", this.on_service_category_click);
      $("[name='save_button']").on("click", this.on_form_submit);
      $("tr[fieldname=AdHoc] input[type='checkbox']").on("click", this.recalculate_records);
      $("tr[fieldname=Composite] input[type='checkbox']").on("click", this.recalculate_records);
      $("tr[fieldname=InvoiceExclude] input[type='checkbox']").on("click", this.recalculate_records);
      $("tr[fieldname=Analyses] input[type='checkbox']").on("click", this.on_analysis_checkbox_click);
      $("tr[fieldname=Client] input[type='text']").on("selected change", this.on_client_changed);
      $("tr[fieldname=ReportDryMatter] input[type='checkbox']").on("click", this.on_reportdrymatter_click);
      $("input.min").on("change", this.on_analysis_specification_changed);
      $("input.max").on("change", this.on_analysis_specification_changed);
      $("input.err").on("change", this.on_analysis_specification_changed);
      $(".service-lockbtn").on("click", this.on_analysis_lock_button_click);
      $(".service-infobtn").on("click", this.on_analysis_details_click);
      $("tr[fieldname=Sample] input[type='text']").on("selected change", this.on_sample_changed);
      $("tr[fieldname=SampleType] input[type='text']").on("selected change", this.on_sampletype_changed);
      $("tr[fieldname=Specification] input[type='text']").on("selected change", this.on_specification_changed);
      $("tr[fieldname=Template] input[type='text']").on("selected change", this.on_analysis_template_changed);
      $("tr[fieldname=Profiles] input[type='text']").on("selected", this.on_analysis_profile_selected);
      $("tr[fieldname=Profiles] img.deletebtn").live("click", this.on_analysis_profile_removed);
      $("img.copybutton").on("click", this.on_copy_button_click);

      /* internal events */
      $(this).on("form:changed", this.recalculate_records);
      $(this).on("data:updated", this.update_form);
      $(this).on("data:updated", this.recalculate_prices);
      $(this).on("data:updated", this.hide_all_service_info);
      $(this).on("ajax:start", this.on_ajax_start);
      return $(this).on("ajax:end", this.on_ajax_end);
    };

    AnalysisRequestAdd.prototype.template_dialog = function(template_id, context, buttons) {

      /*
       * Render the content of a Handlebars template in a jQuery UID dialog
         [1] http://handlebarsjs.com/
         [2] https://jqueryui.com/dialog/
       */
      var content;
      if (buttons == null) {
        buttons = {};
        buttons[this._("Yes")] = function() {
          $(this).trigger("yes");
          return $(this).dialog("close");
        };
        buttons[this._("No")] = function() {
          $(this).trigger("no");
          return $(this).dialog("close");
        };
      }
      content = this.render_template(template_id, context);
      return $(content).dialog({
        width: 450,
        resizable: false,
        closeOnEscape: false,
        buttons: buttons,
        open: function(event, ui) {
          return $(".ui-dialog-titlebar-close").hide();
        }
      });
    };

    AnalysisRequestAdd.prototype.render_template = function(template_id, context) {

      /*
       * Render Handlebars JS template
       */
      var content, source, template;
      source = $("#" + template_id).html();
      if (!source) {
        return;
      }
      template = Handlebars.compile(source);
      content = template(context);
      return content;
    };

    AnalysisRequestAdd.prototype.recalculate_records = function() {

      /*
       * Submit all form values to the server to recalculate the records
       */
      return this.ajax_post_form("recalculate_records").done(function(records) {
        console.debug("Recalculate Analyses: Records=", records);
        this.records_snapshot = records;
        return $(this).trigger("data:updated", records);
      });
    };

    AnalysisRequestAdd.prototype.recalculate_prices = function() {

      /*
       * Submit all form values to the server to recalculate the prices of all columns
       */
      return this.ajax_post_form("recalculate_prices").done(function(data) {
        var arnum, prices;
        console.debug("Recalculate Prices Data=", data);
        for (arnum in data) {
          if (!hasProp.call(data, arnum)) continue;
          prices = data[arnum];
          $("#discount-" + arnum).text(prices.discount);
          $("#subtotal-" + arnum).text(prices.subtotal);
          $("#vat-" + arnum).text(prices.vat);
          $("#total-" + arnum).text(prices.total);
        }
        return $(this).trigger("prices:updated", data);
      });
    };

    AnalysisRequestAdd.prototype.update_form = function(event, records) {

      /*
       * Update form according to the server data
       */
      var me;
      console.debug("*** update_form ***");
      me = this;
      $(".service-lockbtn").hide();
      return $.each(records, function(arnum, record) {
        $.each(record.client_metadata, function(uid, client) {
          return me.set_client(arnum, client);
        });
        $.each(record.service_metadata, function(uid, metadata) {
          var lock;
          lock = $("#" + uid + "-" + arnum + "-lockbtn");
          if (uid in record.service_to_profiles) {
            lock.show();
          }
          if (uid in record.service_to_templates) {
            lock.show();
          }
          if (uid in record.service_to_dms) {
            lock.show();
          }
          return me.set_service(arnum, uid, true);
        });
        $.each(record.template_metadata, function(uid, template) {
          return me.set_template(arnum, template);
        });
        $.each(record.specification_metadata, function(uid, spec) {
          return $.each(spec.specifications, function(uid, service_spec) {
            return me.set_service_spec(arnum, uid, service_spec);
          });
        });
        $.each(record.sample_metadata, function(uid, sample) {
          return me.set_sample(arnum, sample);
        });
        $.each(record.sampletype_metadata, function(uid, sampletype) {
          return me.set_sampletype(arnum, sampletype);
        });
        return $.each(record.unmet_dependencies, function(uid, dependencies) {
          var context, dialog, service;
          service = record.service_metadata[uid];
          context = {
            "service": service,
            "dependencies": dependencies
          };
          dialog = me.template_dialog("dependency-add-template", context);
          dialog.on("yes", function() {
            $.each(dependencies, function(index, service) {
              return me.set_service(arnum, service.uid, true);
            });
            return $(me).trigger("form:changed");
          });
          dialog.on("no", function() {
            me.set_service(arnum, uid, false);
            return $(me).trigger("form:changed");
          });
          return false;
        });
      });
    };

    AnalysisRequestAdd.prototype.get_portal_url = function() {

      /*
       * Return the portal url (calculated in code)
       */
      var url;
      url = $("input[name=portal_url]").val();
      return url;
    };

    AnalysisRequestAdd.prototype.get_base_url = function() {

      /*
       * Return the current (relative) base url
       */
      var base_url;
      base_url = window.location.href;
      if (base_url.search("/portal_factory") >= 0) {
        return base_url.split("/portal_factory")[0];
      }
      return base_url.split("/ar_add")[0];
    };

    AnalysisRequestAdd.prototype.get_authenticator = function() {

      /*
       * Get the authenticator value
       */
      return $("input[name='_authenticator']").val();
    };

    AnalysisRequestAdd.prototype.get_form = function() {

      /*
       * Return the form element
       */
      return $("#analysisrequest_add_form");
    };

    AnalysisRequestAdd.prototype.get_fields = function(arnum) {

      /*
       * Get all fields of the form
       */
      var fields, fields_selector, form;
      form = this.get_form();
      fields_selector = "tr[fieldname] td[arnum] input";
      if (arnum != null) {
        fields_selector = "tr[fieldname] td[arnum=" + arnum + "] input";
      }
      fields = $(fields_selector, form);
      return fields;
    };

    AnalysisRequestAdd.prototype.get_field_by_id = function(id, arnum) {

      /*
       * Query the field by id
       */
      var field_id, name, ref, suffix;
      ref = id.split("_"), name = ref[0], suffix = ref[1];
      field_id = name + "-" + arnum;
      if (suffix != null) {
        field_id = field_id + "_" + suffix;
      }
      if (!id.startsWith("#")) {
        field_id = "#" + field_id;
      }
      console.debug("get_field_by_id: $(" + field_id + ")");
      return $(field_id);
    };

    AnalysisRequestAdd.prototype.flush_reference_field = function(field) {

      /*
       * Empty the reference field
       */
      var catalog_name;
      catalog_name = field.attr("catalog_name");
      if (!catalog_name) {
        return;
      }
      field.val("");
      return $("input[type=hidden]", field.parent()).val("");
    };

    AnalysisRequestAdd.prototype.set_reference_field_query = function(field, query, type) {
      var catalog_name, catalog_query, new_query, options, url;
      if (type == null) {
        type = "base_query";
      }

      /*
       * Set the catalog search query for the given reference field
       * XXX This is lame! The field should provide a proper API.
       */
      catalog_name = field.attr("catalog_name");
      if (!catalog_name) {
        return;
      }
      options = $.parseJSON(field.attr("combogrid_options"));
      url = this.get_base_url();
      url += "/" + options.url;
      url += "?_authenticator=" + (this.get_authenticator());
      url += "&catalog_name=" + catalog_name;
      url += "&colModel=" + ($.toJSON(options.colModel));
      url += "&search_fields=" + ($.toJSON(options.search_fields));
      url += "&discard_empty=" + ($.toJSON(options.discard_empty));
      catalog_query = $.parseJSON(field.attr(type));
      $.extend(catalog_query, query);
      new_query = $.toJSON(catalog_query);
      console.debug("set_reference_field_query: query=" + new_query);
      if (type === 'base_query') {
        url += "&base_query=" + new_query;
        url += "&search_query=" + (field.attr('search_query'));
      } else {
        url += "&base_query=" + (field.attr('base_query'));
        url += "&search_query=" + new_query;
      }
      options.url = url;
      options.force_all = "false";
      field.combogrid(options);
      return field.attr("search_query", "{}");
    };

    AnalysisRequestAdd.prototype.set_reference_field = function(field, uid, title) {

      /*
       * Set the value and the uid of a reference field
       * XXX This is lame! The field should handle this on data change.
       */
      var $field, $parent, div, existing_uids, fieldname, img, me, mvc, portal_url, src, uids, uids_field;
      me = this;
      $field = $(field);
      $parent = field.closest("div.field");
      fieldname = field.attr("name");
      console.debug("set_reference_field:: field=" + fieldname + " uid=" + uid + " title=" + title);
      uids_field = $("input[type=hidden]", $parent);
      existing_uids = uids_field.val();
      if (existing_uids.indexOf(uid) >= 0) {
        return;
      }
      if (existing_uids.length === 0) {
        uids_field.val(uid);
      } else {
        uids = uids_field.val().split(",");
        uids.push(uid);
        uids_field.val(uids.join(","));
      }
      $field.val(title);
      mvc = $(".multiValued-listing", $parent);
      if (mvc.length > 0) {
        portal_url = this.get_portal_url();
        src = portal_url + "/++resource++bika.lims.images/delete.png";
        img = $("<img class='deletebtn'/>");
        img.attr("src", src);
        img.attr("data-contact-title", title);
        img.attr("fieldname", fieldname);
        img.attr("uid", uid);
        div = $("<div class='reference_multi_item'/>");
        div.attr("uid", uid);
        div.append(img);
        div.append(title);
        mvc.append(div);
        return $field.val("");
      }
    };

    AnalysisRequestAdd.prototype.set_client = function(arnum, client) {

      /*
       * Filter Contacts
       * Filter CCContacts
       * Filter InvoiceContacts
       * Filter SamplePoints
       * Filter ARTemplates
       * Filter Specification
       * Filter SamplingRound
       */
      var field, query;
      field = $("#Contact-" + arnum);
      query = client.filter_queries.contact;
      this.set_reference_field_query(field, query);
      field = $("#CCContact-" + arnum);
      query = client.filter_queries.cc_contact;
      this.set_reference_field_query(field, query);
      field = $("#InvoiceContact-" + arnum);
      query = client.filter_queries.invoice_contact;
      this.set_reference_field_query(field, query);
      field = $("#SamplePoint-" + arnum);
      query = client.filter_queries.samplepoint;
      this.set_reference_field_query(field, query);
      field = $("#Template-" + arnum);
      query = client.filter_queries.artemplates;
      this.set_reference_field_query(field, query);
      field = $("#Profiles-" + arnum);
      query = client.filter_queries.analysisprofiles;
      this.set_reference_field_query(field, query);
      field = $("#Specification-" + arnum);
      query = client.filter_queries.analysisspecs;
      this.set_reference_field_query(field, query);
      field = $("#SamplingRound-" + arnum);
      query = client.filter_queries.samplinground;
      return this.set_reference_field_query(field, query);
    };

    AnalysisRequestAdd.prototype.set_sample = function(arnum, sample) {

      /*
       * Apply the sample data to all fields of arnum
       */
      var field, title, uid, value;
      field = $("#SamplingDate-" + arnum);
      value = sample.sampling_date;
      field.val(value);
      field = $("#SampleType-" + arnum);
      uid = sample.sample_type_uid;
      title = sample.sample_type_title;
      this.set_reference_field(field, uid, title);
      field = $("#EnvironmentalConditions-" + arnum);
      value = sample.environmental_conditions;
      field.val(value);
      field = $("#ClientSampleID-" + arnum);
      value = sample.client_sample_id;
      field.val(value);
      field = $("#ClientReference-" + arnum);
      value = sample.client_reference;
      field.val(value);
      field = $("#AdHoc-" + arnum);
      field.prop("checked", sample.adhoc);
      field = $("#Composite-" + arnum);
      field.prop("checked", sample.composite);
      field = $("#SampleCondition-" + arnum);
      uid = sample.sample_condition_uid;
      title = sample.sample_condition_title;
      this.set_reference_field(field, uid, title);
      field = $("#SamplePoint-" + arnum);
      uid = sample.sample_point_uid;
      title = sample.sample_point_title;
      this.set_reference_field(field, uid, title);
      field = $("#StorageLocation-" + arnum);
      uid = sample.storage_location_uid;
      title = sample.storage_location_title;
      this.set_reference_field(field, uid, title);
      field = $("#DefaultContainerType-" + arnum);
      uid = sample.container_type_uid;
      title = sample.container_type_title;
      return this.set_reference_field(field, uid, title);
    };

    AnalysisRequestAdd.prototype.set_sampletype = function(arnum, sampletype) {

      /*
       * Recalculate partitions
       * Filter Sample Points
       */
      var field, query;
      field = $("#SamplePoint-" + arnum);
      query = sampletype.filter_queries.samplepoint;
      this.set_reference_field_query(field, query);
      field = $("#Specification-" + arnum);
      query = sampletype.filter_queries.specification;
      return this.set_reference_field_query(field, query);
    };

    AnalysisRequestAdd.prototype.set_template = function(arnum, template) {

      /*
       * Apply the template data to all fields of arnum
       */
      var field, me, part_selectors, title, uid;
      field = $("#SampleType-" + arnum);
      uid = template.sample_type_uid;
      title = template.sample_type_title;
      this.set_reference_field(field, uid, title);
      field = $("#SamplePoint-" + arnum);
      uid = template.sample_point_uid;
      title = template.sample_point_title;
      this.set_reference_field(field, uid, title);
      field = $("#Profiles-" + arnum);
      uid = template.analysis_profile_uid;
      title = template.analysis_profile_title;
      this.set_reference_field(field, uid, title);
      field = $("#Remarks-" + arnum);
      field.text(template.remarks);
      field = $("#Composite-" + arnum);
      field.prop("checked", template.composite);
      field = $("#ReportDryMatter-" + arnum);
      field.prop("checked", template.report_dry_matter);
      me = this;
      part_selectors = $(".part-select");
      return $.each(part_selectors, function(index, part_selector) {
        var $el, context, partitions, parts, selected_part;
        $el = $(part_selector);
        $el.empty();
        uid = $el.attr("uid");
        selected_part = "part-1";
        if (uid in template.analyses_partitions) {
          selected_part = template.analyses_partitions[uid];
        }
        partitions = [];
        $.each(template.partitions, function(index, part) {
          var part_id;
          part_id = part.part_id;
          return partitions.push({
            part_id: part_id,
            selected: part_id === selected_part
          });
        });
        context = {
          partitions: partitions
        };
        parts = me.render_template("part-select-template", context);
        return $el.append(parts);
      });
    };

    AnalysisRequestAdd.prototype.set_service = function(arnum, uid, checked) {

      /*
       * Select the checkbox of a service by UID
       */
      var el, poc;
      console.debug("*** set_service::AR=" + arnum + " UID=" + uid + " checked=" + checked);
      el = $("td[fieldname='Analyses-" + arnum + "'] #cb_" + uid);
      el.prop("checked", checked);
      poc = el.closest("tr[poc]").attr("poc");
      if (this.is_poc_expanded(poc)) {
        return el.closest("tr").addClass("visible");
      }
    };

    AnalysisRequestAdd.prototype.set_service_spec = function(arnum, uid, spec) {

      /*
       * Set the specification of the service
       */
      var el, err, max, min;
      console.debug("*** set_service_spec::AR=" + arnum + " UID=" + uid + " spec=", spec);
      el = $("div#" + uid + "-" + arnum + "-specifications");
      min = $(".min", el);
      max = $(".max", el);
      err = $(".err", el);
      min.val(spec.min);
      max.val(spec.max);
      return err.val(spec.error);
    };

    AnalysisRequestAdd.prototype.get_service = function(uid) {

      /*
       * Fetch the service data from server by UID
       */
      var options;
      options = {
        data: {
          uid: uid
        },
        processData: true,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
      };
      return this.ajax_post_form("get_service", options).done(function(data) {
        return console.debug("get_service::data=", data);
      });
    };

    AnalysisRequestAdd.prototype.hide_all_service_info = function() {

      /*
       * hide all open service info boxes
       */
      var info;
      info = $("div.service-info");
      return info.hide();
    };

    AnalysisRequestAdd.prototype.is_poc_expanded = function(poc) {

      /*
       * Checks if the point of captures are visible
       */
      var el;
      el = $("tr.service-listing-header[poc=" + poc + "]");
      return el.hasClass("visible");
    };

    AnalysisRequestAdd.prototype.toggle_poc_categories = function(poc, toggle) {

      /*
       * Toggle all categories within a point of capture (lab/service)
       * :param poc: the point of capture (lab/field)
       * :param toggle: services visible if true
       */
      var categories, el, services, services_checked, toggle_buttons;
      if (toggle == null) {
        toggle = !this.is_poc_expanded(poc);
      }
      el = $("tr[data-poc=" + poc + "]");
      categories = $("tr.category." + poc);
      services = $("tr.service." + poc);
      services_checked = $("input[type=checkbox]:checked", services);
      toggle_buttons = $(".service-category-toggle");
      if (toggle) {
        el.addClass("visible");
        categories.addClass("visible");
        return services_checked.closest("tr").addClass("visible");
      } else {
        el.removeClass("visible");
        categories.removeClass("visible");
        categories.removeClass("expanded");
        services.removeClass("visible");
        services.removeClass("expanded");
        return toggle_buttons.text("+");
      }
    };


    /* EVENT HANDLER */

    AnalysisRequestAdd.prototype.on_client_changed = function(event) {

      /*
       * Eventhandler when the client changed (happens on Batches)
       */
      var $el, arnum, el, field_ids, me, uid;
      me = this;
      el = event.currentTarget;
      $el = $(el);
      uid = $el.attr("uid");
      arnum = $el.closest("[arnum]").attr("arnum");
      console.debug("°°° on_client_changed: arnum=" + arnum + " °°°");
      field_ids = ["Contact", "CCContact", "InvoiceContact", "SamplePoint", "Template", "Profiles", "Specification"];
      $.each(field_ids, function(index, id) {
        var field;
        field = me.get_field_by_id(id, arnum);
        return me.flush_reference_field(field, arnum);
      });
      return $(me).trigger("form:changed");
    };

    AnalysisRequestAdd.prototype.on_analysis_specification_changed = function(event) {

      /*
       * Eventhandler when the specification of an analysis service changed
       */
      var me;
      console.debug("°°° on_analysis_specification_changed °°°");
      me = this;
      return $(me).trigger("form:changed");
    };

    AnalysisRequestAdd.prototype.on_analysis_details_click = function(event) {

      /*
       * Eventhandler when the user clicked on the info icon of a service.
       */
      var $el, arnum, context, data, dms, el, extra, info, profiles, record, specifications, template, templates, uid;
      el = event.currentTarget;
      $el = $(el);
      uid = $el.attr("uid");
      arnum = $el.closest("[arnum]").attr("arnum");
      console.debug("°°° on_analysis_column::UID=" + uid + "°°°");
      info = $("div.service-info", $el.parent());
      info.empty();
      data = info.data("data");
      extra = {
        profiles: [],
        templates: [],
        specifications: [],
        drymatter: []
      };
      record = this.records_snapshot[arnum];
      if (uid in record.service_to_dms) {
        dms = record.service_to_dms[uid];
        $.each(dms, function(index, uid) {
          return extra["drymatter"].push(record.dms_metadata[uid]);
        });
      }
      if (uid in record.service_to_profiles) {
        profiles = record.service_to_profiles[uid];
        $.each(profiles, function(index, uid) {
          return extra["profiles"].push(record.profile_metadata[uid]);
        });
      }
      if (uid in record.service_to_templates) {
        templates = record.service_to_templates[uid];
        $.each(templates, function(index, uid) {
          return extra["templates"].push(record.template_metadata[uid]);
        });
      }
      if (uid in record.service_to_specifications) {
        specifications = record.service_to_specifications[uid];
        $.each(specifications, function(index, uid) {
          return extra["specifications"].push(record.specification_metadata[uid]);
        });
      }
      if (!data) {
        return this.get_service(uid).done(function(data) {
          var context, template;
          context = $.extend({}, data, extra);
          template = this.render_template("service-info", context);
          info.append(template);
          info.data("data", context);
          return info.fadeIn();
        });
      } else {
        context = $.extend({}, data, extra);
        template = this.render_template("service-info", context);
        info.append(template);
        return info.fadeToggle();
      }
    };

    AnalysisRequestAdd.prototype.on_analysis_lock_button_click = function(event) {

      /*
       * Eventhandler when an Analysis Profile was removed.
       */
      var $el, arnum, buttons, context, dialog, dms_uid, el, me, profile_uid, record, template_uid, uid;
      console.debug("°°° on_analysis_lock_button_click °°°");
      me = this;
      el = event.currentTarget;
      $el = $(el);
      uid = $el.attr("uid");
      arnum = $el.closest("[arnum]").attr("arnum");
      record = me.records_snapshot[arnum];
      context = {};
      context["service"] = record.service_metadata[uid];
      context["profiles"] = [];
      context["templates"] = [];
      context["drymatter"] = [];
      if (uid in record.service_to_profiles) {
        profile_uid = record.service_to_profiles[uid];
        context["profiles"].push(record.profile_metadata[profile_uid]);
      }
      if (uid in record.service_to_templates) {
        template_uid = record.service_to_templates[uid];
        context["templates"].push(record.template_metadata[template_uid]);
      }
      if (uid in record.service_to_dms) {
        dms_uid = record.service_to_dms[uid];
        context["drymatter"].push(record.dms_metadata[dms_uid]);
      }
      buttons = {
        OK: function() {
          return $(this).dialog("close");
        }
      };
      return dialog = this.template_dialog("service-dependant-template", context, buttons);
    };

    AnalysisRequestAdd.prototype.on_sample_changed = function(event) {

      /*
       * Eventhandler when the Sample was changed.
       */
      var $el, arnum, el, has_sample_selected, me, uid, val;
      me = this;
      el = event.currentTarget;
      $el = $(el);
      uid = $(el).attr("uid");
      val = $el.val();
      arnum = $el.closest("[arnum]").attr("arnum");
      has_sample_selected = $el.val();
      console.debug("°°° on_sample_change::UID=" + uid + " Sample=" + val + "°°°");
      if (!has_sample_selected) {
        $("input[type=hidden]", $el.parent()).val("");
      }
      return $(me).trigger("form:changed");
    };

    AnalysisRequestAdd.prototype.on_sampletype_changed = function(event) {

      /*
       * Eventhandler when the SampleType was changed.
       * Fires form:changed event
       */
      var $el, arnum, el, field_ids, has_sampletype_selected, me, uid, val;
      me = this;
      el = event.currentTarget;
      $el = $(el);
      uid = $(el).attr("uid");
      val = $el.val();
      arnum = $el.closest("[arnum]").attr("arnum");
      has_sampletype_selected = $el.val();
      console.debug("°°° on_sampletype_change::UID=" + uid + " SampleType=" + val + "°°°");
      if (!has_sampletype_selected) {
        $("input[type=hidden]", $el.parent()).val("");
      }
      field_ids = ["SamplePoint", "Specification"];
      $.each(field_ids, function(index, id) {
        var field;
        field = me.get_field_by_id(id, arnum);
        return me.flush_reference_field(field, arnum);
      });
      return $(me).trigger("form:changed");
    };

    AnalysisRequestAdd.prototype.on_specification_changed = function(event) {

      /*
       * Eventhandler when the Specification was changed.
       */
      var $el, arnum, el, has_specification_selected, me, uid, val;
      me = this;
      el = event.currentTarget;
      $el = $(el);
      uid = $(el).attr("uid");
      val = $el.val();
      arnum = $el.closest("[arnum]").attr("arnum");
      has_specification_selected = $el.val();
      console.debug("°°° on_specification_change::UID=" + uid + " Specification=" + val + "°°°");
      if (!has_specification_selected) {
        $("input[type=hidden]", $el.parent()).val("");
      }
      return $(me).trigger("form:changed");
    };

    AnalysisRequestAdd.prototype.on_analysis_template_changed = function(event) {

      /*
       * Eventhandler when an Analysis Template was changed.
       */
      var $el, arnum, context, dialog, el, has_template_selected, me, record, template_metadata, template_services, uid, val;
      me = this;
      el = event.currentTarget;
      $el = $(el);
      uid = $(el).attr("uid");
      val = $el.val();
      arnum = $el.closest("[arnum]").attr("arnum");
      has_template_selected = $el.val();
      console.debug("°°° on_analysis_template_change::UID=" + uid + " Template=" + val + "°°°");
      if (!has_template_selected) {
        $("input[type=hidden]", $el.parent()).val("");
        record = this.records_snapshot[arnum];
        template_metadata = record.profile_metadata[uid];
        template_services = [];
        $.each(record.template_to_services[uid], function(index, uid) {
          return template_services.push(record.service_metadata[uid]);
        });
        context = {};
        context["template"] = template_metadata;
        context["services"] = template_services;
        dialog = this.template_dialog("template-remove-template", context);
        dialog.on("yes", function() {
          $.each(template_services, function(index, service) {
            return me.set_service(arnum, service.uid, false);
          });
          return $(me).trigger("form:changed");
        });
        dialog.on("no", function() {
          return $(me).trigger("form:changed");
        });
      }
      return $(me).trigger("form:changed");
    };

    AnalysisRequestAdd.prototype.on_analysis_profile_selected = function(event) {

      /*
       * Eventhandler when an Analysis Profile was selected.
       */
      var $el, el, me, uid;
      console.debug("°°° on_analysis_profile_selected °°°");
      me = this;
      el = event.currentTarget;
      $el = $(el);
      uid = $(el).attr("uid");
      return $(me).trigger("form:changed");
    };

    AnalysisRequestAdd.prototype.on_analysis_profile_removed = function(event) {

      /*
       * Eventhandler when an Analysis Profile was removed.
       */
      var $el, arnum, context, dialog, el, me, profile_metadata, profile_services, record, uid;
      console.debug("°°° on_analysis_profile_removed °°°");
      me = this;
      el = event.currentTarget;
      $el = $(el);
      uid = $el.attr("uid");
      arnum = $el.closest("[arnum]").attr("arnum");
      record = this.records_snapshot[arnum];
      profile_metadata = record.profile_metadata[uid];
      profile_services = [];
      $.each(record.profile_to_services[uid], function(index, uid) {
        return profile_services.push(record.service_metadata[uid]);
      });
      context = {};
      context["profile"] = profile_metadata;
      context["services"] = profile_services;
      me = this;
      dialog = this.template_dialog("profile-remove-template", context);
      dialog.on("yes", function() {
        $.each(profile_services, function(index, service) {
          return me.set_service(arnum, service.uid, false);
        });
        return $(me).trigger("form:changed");
      });
      return dialog.on("no", function() {
        return $(me).trigger("form:changed");
      });
    };

    AnalysisRequestAdd.prototype.on_analysis_checkbox_click = function(event) {

      /*
       * Eventhandler for Analysis Service Checkboxes.
       */
      var $el, checked, el, me, uid;
      me = this;
      el = event.currentTarget;
      checked = el.checked;
      $el = $(el);
      uid = $el.val();
      console.debug("°°° on_analysis_click::UID=" + uid + " checked=" + checked + "°°°");
      return $(me).trigger("form:changed");
    };

    AnalysisRequestAdd.prototype.on_reportdrymatter_click = function(event) {

      /*
       * Eventhandler for ReportDryMatter Checkbox.
       */
      var $el, arnum, checked, context, dialog, dms_metadata, dms_services, el, me, record;
      me = this;
      el = event.currentTarget;
      checked = el.checked;
      $el = $(el);
      arnum = $el.closest("[arnum]").attr("arnum");
      console.debug("°°° on_reportdrymatter_click:: checked=" + checked + "°°°");
      if (!checked) {
        record = this.records_snapshot[arnum];
        dms_metadata = {};
        dms_services = [];
        $.each(record.dms_to_services, function(dms_uid, service_uids) {
          dms_metadata = record.dms_metadata[dms_uid];
          return $.each(service_uids, function(index, service_uid) {
            return dms_services.push(record.service_metadata[service_uid]);
          });
        });
        context = {};
        context["drymatter"] = dms_metadata;
        context["services"] = dms_services;
        me = this;
        dialog = this.template_dialog("drymatter-remove-template", context);
        dialog.on("yes", function() {
          $.each(dms_services, function(index, service) {
            return me.set_service(arnum, service.uid, false);
          });
          return $(me).trigger("form:changed");
        });
        dialog.on("no", function() {
          return $(me).trigger("form:changed");
        });
      }
      return $(me).trigger("form:changed");
    };

    AnalysisRequestAdd.prototype.on_service_listing_header_click = function(event) {

      /*
       * Eventhandler for analysis service category header rows.
       * Toggles the visibility of all categories within this poc.
       */
      var $el, poc, toggle, visible;
      $el = $(event.currentTarget);
      poc = $el.data("poc");
      visible = $el.hasClass("visible");
      toggle = !visible;
      return this.toggle_poc_categories(poc, toggle);
    };

    AnalysisRequestAdd.prototype.on_service_category_click = function(event) {

      /*
       * Eventhandler for analysis service category rows.
       * Toggles the visibility of all services within this category.
       * Selected services always stay visible.
       */
      var $btn, $el, category, expanded, poc, services, services_checked;
      event.preventDefault();
      $el = $(event.currentTarget);
      poc = $el.attr("poc");
      $btn = $(".service-category-toggle", $el);
      expanded = $el.hasClass("expanded");
      category = $el.data("category");
      services = $("tr." + poc + "." + category);
      services_checked = $("input[type=checkbox]:checked", services);
      console.debug("°°° on_service_category_click: category=" + category + " °°°");
      if (expanded) {
        $btn.text("+");
        $el.removeClass("expanded");
        services.removeClass("visible");
        services.removeClass("expanded");
        return services_checked.closest("tr").addClass("visible");
      } else {
        $btn.text("-");
        $el.addClass("expanded");
        services.addClass("visible");
        return services.addClass("expanded");
      }
    };

    AnalysisRequestAdd.prototype.on_copy_button_click = function(event) {

      /*
       * Eventhandler for the field copy button per row.
       * Copies the value of the first field in this row to the remaining.
       * XXX Refactor
       */
      var arnum, checkbox, checkbox_other, e, el, fieldname, html, i, input, input_other, me, multi_div, multi_divX, nr_ars, option, select_options, selected, td, td1, tr, uid1, val1, value;
      console.debug("°°° on_copy_button_click °°°");
      nr_ars = parseInt($('input[id="ar_count"]').val(), 10);
      me = this;
      el = event.target;
      tr = $(el).closest('tr')[0];
      fieldname = $(tr).attr('fieldname');
      td1 = $(tr).find('td[arnum="0"]')[0];
      e = void 0;
      td = void 0;
      html = void 0;
      if ($(td1).find('.ArchetypesReferenceWidget').length > 0) {
        val1 = $(td1).find('input[type="text"]').val();
        uid1 = $(td1).find('input[type="text"]').attr('uid');
        multi_div = $('#' + fieldname + '-0-listing');
        arnum = 1;
        while (arnum < nr_ars) {
          td = $(tr).find('td[arnum="' + arnum + '"]')[0];
          e = $(td).find('input[type="text"]');
          $(e).val(val1);
          $(e).attr('uid', uid1);
          $(td).find('input[id$="_uid"]').val(uid1);
          multi_divX = multi_div.clone(true);
          $(multi_divX).attr('id', fieldname + '-' + arnum + '-listing');
          $('#' + fieldname + '-' + arnum + '-listing').replaceWith(multi_divX);
          arnum++;
        }
      } else if ($(td1).find('.RejectionWidget').length > 0) {
        checkbox = $(td1).find('.rejectionwidget-checkbox').prop('checked');
        arnum = 1;
        while (arnum < nr_ars) {
          td = $(tr).find('td[arnum="' + arnum + '"]')[0];
          e = $(td).find('.rejectionwidget-checkbox')[0];
          if (checkbox) {
            $(e).attr('checked', true);
          } else {
            $(e).removeAttr('checked');
          }
          arnum++;
        }
        checkbox_other = $(td1).find('.rejectionwidget-checkbox-other').prop('checked');
        arnum = 1;
        while (arnum < nr_ars) {
          td = $(tr).find('td[arnum="' + arnum + '"]')[0];
          e = $(td).find('.rejectionwidget-checkbox-other')[0];
          if (checkbox_other) {
            $(e).attr('checked', true);
          } else {
            $(e).removeAttr('checked');
          }
          $(e).trigger('copy');
          arnum++;
        }
        input_other = $(td1).find('.rejectionwidget-input-other').val();
        arnum = 1;
        while (arnum < nr_ars) {
          td = $(tr).find('td[arnum="' + arnum + '"]')[0];
          e = $(td).find('.rejectionwidget-input-other')[0];
          $(e).val(input_other);
          arnum++;
        }
        select_options = $(td1).find('.rejectionwidget-multiselect').find('option');
        i = 0;
        while (select_options.length > i) {
          option = select_options[i];
          value = $(option).val();
          selected = option.selected;
          arnum = 1;
          while (arnum < nr_ars) {
            td = $(tr).find('td[arnum="' + arnum + '"]')[0];
            e = $(td).find('.rejectionwidget-multiselect option[value="' + value + '"]');
            $(e).attr('selected', selected);
            $(td).find('select.rejectionwidget-multiselect').trigger('copy');
            arnum++;
          }
          i++;
        }
      } else if ($(td1).find('select').length > 0) {
        input = $(td1).find('select').val();
        arnum = 1;
        while (arnum < nr_ars) {
          td = $(tr).find('td[arnum="' + arnum + '"]')[0];
          e = $(td).find('select')[0];
          $(e).val(input);
          arnum++;
        }
      } else if ($(td1).find('input[type="checkbox"]').length > 0) {
        val1 = $(td1).find('input[type="checkbox"]').prop('checked');
        arnum = 1;
        while (arnum < nr_ars) {
          td = $(tr).find('td[arnum="' + arnum + '"]')[0];
          e = $(td).find('input[type="checkbox"]')[0];
          if (val1) {
            $(e).attr('checked', true);
          } else {
            $(e).removeAttr('checked');
          }
          arnum++;
        }
      } else if ($(td1).find('input[type="text"]').length > 0) {
        val1 = $(td1).find('input').val();
        arnum = 1;
        while (arnum < nr_ars) {
          td = $(tr).find('td[arnum="' + arnum + '"]')[0];
          e = $(td).find('input')[0];
          $(e).val(val1);
          arnum++;
        }
      } else if ($(td1).find('textarea').length > 0) {
        val1 = $(td1).find('textarea').val();
        arnum = 1;
        while (arnum < nr_ars) {
          td = $(tr).find('td[arnum="' + arnum + '"]')[0];
          e = $(td).find('textarea')[0];
          $(e).val(val1);
          arnum++;
        }
      }
      return $(me).trigger("form:changed");
    };

    AnalysisRequestAdd.prototype.ajax_post_form = function(endpoint, options) {
      var ajax_options, base_url, form, form_data, me, url;
      if (options == null) {
        options = {};
      }

      /*
       * Ajax POST the form data to the given endpoint
       */
      console.debug("°°° ajax_post_form::Endpoint=" + endpoint + " °°°");
      base_url = this.get_base_url();
      url = base_url + "/ajax_ar_add/" + endpoint;
      console.debug("Ajax POST to url " + url);
      form = $("#analysisrequest_add_form");
      form_data = new FormData(form[0]);
      ajax_options = {
        url: url,
        type: 'POST',
        data: form_data,
        context: this,
        cache: false,
        dataType: 'json',
        processData: false,
        contentType: false
      };
      $.extend(ajax_options, options);

      /* Execute the request */
      me = this;
      $(me).trigger("ajax:start");
      return $.ajax(ajax_options).always(function(data) {
        return $(me).trigger("ajax:end");
      });
    };

    AnalysisRequestAdd.prototype.on_ajax_start = function() {

      /*
       * Ajax request started
       */
      var button;
      console.debug("°°° on_ajax_start °°°");
      button = $("input[name=save_button]");
      return button.prop({
        "disabled": true
      });
    };

    AnalysisRequestAdd.prototype.on_ajax_end = function() {

      /*
       * Ajax request finished
       */
      var button;
      console.debug("°°° on_ajax_end °°°");
      button = $("input[name=save_button]");
      return button.prop({
        "disabled": false
      });
    };

    AnalysisRequestAdd.prototype.on_form_submit = function(event, callback) {

      /*
       * Eventhandler for the form submit button.
       * Extracts and submits all form data asynchronous.
       */
      var base_url, me;
      console.debug("°°° on_form_submit °°°");
      event.preventDefault();
      me = this;
      base_url = me.get_base_url();
      $("div.error").removeClass("error");
      $("div.fieldErrorBox").text("");
      return this.ajax_post_form("submit").done(function(data) {

        /*
         * data contains the following useful keys:
         * - errors: any errors which prevented the AR from being created
         *   these are displayed immediately and no further ation is taken
         * - destination: the URL to which we should redirect on success.
         *   This includes GET params for printing labels, so that we do not
         *   have to care about this here.
         */
        var ars, destination, errorbox, field, fieldname, message, msg, parent, q, stickertemplate;
        if (data['errors']) {
          msg = '';
          for (fieldname in data.errors) {
            field = $("#" + fieldname);
            parent = field.parent("div.field");
            if (field && parent) {
              parent.toggleClass("error");
              errorbox = parent.children("div.fieldErrorBox");
              message = data.errors[fieldname];
              errorbox.text(message);
              msg += message + "<br/>";
            }
          }
          window.bika.lims.portalMessage(msg);
          return window.scroll(0, 0);
        } else if (data['stickers']) {
          destination = base_url;
          ars = data['stickers'];
          stickertemplate = data['stickertemplate'];
          q = '/sticker?autoprint=1&template=' + stickertemplate + '&items=' + ars.join(',');
          return window.location.replace(destination + q);
        } else {
          return window.location.replace(base_url);
        }
      });
    };

    return AnalysisRequestAdd;

  })();

}).call(this);
