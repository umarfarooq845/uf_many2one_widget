{
    'name': 'Tooltip Many2one Widget',
    'version': '19.0.1.0',
    'summary': 'Configurable hover view for Many2one fields',
    'description': 'Allows configuring specific fields to be displayed on hover for Many2one fields per model.',
    'category': 'Tools',
    'author': 'Umar Farooq',
    'depends': ['web', 'base'],
    'data': [
        'security/ir.model.access.csv',
        'views/hover_config_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'uf_many2one_widget/static/src/js/many2one_hover.js',
            'uf_many2one_widget/static/src/xml/many2one_hover.xml',
        ],
    },
    'installable': True,
    'application': False,
    'license': 'LGPL-3',
}
