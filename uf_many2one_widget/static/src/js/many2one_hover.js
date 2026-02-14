/** @odoo-module **/

import { Many2One } from "@web/views/fields/many2one/many2one";
import { patch } from "@web/core/utils/patch";
import { usePopover } from "@web/core/popover/popover_hook";
import { useService } from "@web/core/utils/hooks";
import { Component, xml } from "@odoo/owl";
import { ListRenderer } from "@web/views/list/list_renderer";

// Popover Component
class Many2OneHoverPopover extends Component {
    static template = "uf_many2one_widget.HoverPopover";
    static props = {
        title: { type: String, optional: true },
        fields: { type: Array, optional: true },
        close: { type: Function, optional: true }, // Popover often passes close prop
    };
}

patch(Many2One.prototype, {
    setup() {
        super.setup();

        this.popover = usePopover(Many2OneHoverPopover, {
            position: "right",
            closeOnClickAway: true,
        });
        this.orm = useService("orm");
        this.hoverTimeout = null;
    },

    async onMouseEnter(ev) {
        // Clear any closing timeout
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }

        const relation = this.props.relation;
        // In Many2One component, value is an object or array passed as prop
        // Based on many2one.js: value: { type: [Array, Object, { value: false }], optional: true }
        // and usually has .id or [0]
        let recordId = null;
        let displayName = '';

        const val = this.props.value;
        if (val) {
            if (Array.isArray(val) && val.length > 0) {
                recordId = val[0];
                displayName = val[1];
            } else if (typeof val === 'object' && val.id) {
                recordId = val.id;
                displayName = val.display_name;
            }
        }



        if (!recordId) {
            return;
        }

        // Debounce slightly to avoid spamming
        this.hoverTimeout = setTimeout(async () => {
            try {

                const data = await this.orm.call("cyb.hover.config", "get_hover_data", [relation, recordId]);


                if (data && data.fields && data.fields.length > 0) {
                    this.popover.open(ev.target, {
                        fields: data.fields,
                        title: displayName || 'Details',
                    });
                } else {

                }
            } catch (e) {
                console.error("Error fetching hover data", e);
            }
        }, 500); // 500ms delay
    },

    onMouseLeave() {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        // Add a small delay for closing so user can move to popover if needed (though verify if popover is interactive)
        // If not interactive, we can close immediately. 
        // For now, close immediately or with short delay.
        this.closeTimeout = setTimeout(() => {
            this.popover.close();
        }, 100);
    },
});


patch(ListRenderer.prototype, {
    setup() {
        super.setup();
        this.hoverPopover = usePopover(Many2OneHoverPopover, {
            position: "right",
            closeOnClickAway: true,
        });
        this.orm = useService("orm");
        this.hoverTimeout = null;
        this.hoverCloseTimeout = null;
    },

    async onCellMouseEnter(ev, record, column) {
        if (column.type !== 'field') return;

        const list = this.props.list;
        // Check where fields are located
        const fields = list ? (list.fields || (list.model && list.model.fields)) : null;

        if (!list || !fields) return;

        const field = fields[column.name];
        if (!field || field.type !== 'many2one') return;

        if (this.hoverCloseTimeout) {
            clearTimeout(this.hoverCloseTimeout);
            this.hoverCloseTimeout = null;
        }

        const relation = field.relation;
        const value = record.data[column.name];

        let recordId = null;
        let displayName = '';

        if (value) {
            if (Array.isArray(value) && value.length > 0) {
                recordId = value[0];
                displayName = value[1];
            } else if (typeof value === 'object' && value.id) {
                recordId = value.id;
                displayName = value.display_name;
            }
        }

        if (!recordId) return;

        this.hoverTimeout = setTimeout(async () => {
            try {
                const data = await this.orm.call("cyb.hover.config", "get_hover_data", [relation, recordId]);

                if (data && data.fields && data.fields.length > 0) {
                    this.hoverPopover.open(ev.target, {
                        fields: data.fields,
                        title: displayName || 'Details',
                    });
                }
            } catch (e) {
                console.error("Error fetching hover data list view", e);
            }
        }, 500);
    },

    onCellMouseLeave(ev) {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }

        this.hoverCloseTimeout = setTimeout(() => {
            this.hoverPopover.close();
        }, 100);
    }
});
