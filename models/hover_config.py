from odoo import models, fields, api

class CybHoverConfig(models.Model):
    _name = 'cyb.hover.config'
    _description = 'Many2one Hover Configuration'
    _rec_name = 'model_id'

    model_id = fields.Many2one('ir.model', string='Model', required=True, ondelete='cascade')
    field_ids = fields.Many2many('ir.model.fields', string='Fields to Show', domain="[('model_id', '=', model_id)]")

    # _sql_constraints = [
    #     ('model_uniq', 'unique(model_id)', 'Only one configuration per model is allowed!'),
    # ]

    @api.model
    def get_hover_data(self, model_name, record_id):
        """
        Fetch configured fields' data for the given record.
        Called via ORM from frontend.
        """
        # 1. Find configuration for this model
        config = self.sudo().search([('model_id.model', '=', model_name)], limit=1)
        
        if not config:
            return None
        try:
            record = self.env[model_name].browse(record_id)
            record.check_access_rights('read')
            record.check_access_rule('read')
        except Exception:
            return {'error': 'Access Denied'}
        field_names = config.field_ids.mapped('name')
        if not field_names:
            return {'fields': []}
        try:
            data = record.read(field_names)[0]
        except Exception:
             return {'fields': []}
        result = []
        for field in config.field_ids:
            field_name = field.name
            field_label = field.field_description
            value = data.get(field_name)
            
            # Handle relational fields display names
            if isinstance(value, tuple):
                 value = value[1]
            elif isinstance(value, list) and value and isinstance(value[0], int):
                 # x2many field: value is list of IDs
                 # Get the comodel
                 field_def = record._fields[field_name]
                 if field_def.type in ['one2many', 'many2many']:
                     comodel = field_def.comodel_name
                     # Fetch names, limit to 10
                     related_records = self.env[comodel].browse(value[:10])
                     # Check access? browse() doesn't check, read() does or name_get
                     # We use sudo() for names if permitted or just try/except?
                     # Ideally use the user's access rights.
                     try:
                        names = related_records.mapped('display_name')
                        value = ", ".join(names)
                        if len(value) > 10:
                            value += f", ... ({len(value) - 10} more)"
                     except Exception:
                        value = f"{len(value)} records (Access Denied)"
                 else:
                     value = f"{len(value)} records"
            
            # Boolean
            if isinstance(value, bool):
                value = "Yes" if value else "No"
                
            # Selection
            if record._fields[field_name].type == 'selection':
                 selection = dict(record._fields[field_name].selection or [])
                 if value in selection:
                     value = selection[value]
            
            if not value:
                value = '-'

            result.append({
                'name': field_name,
                'label': field_label,
                'value': str(value),
            })
            
        return {'fields': result}
