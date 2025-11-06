{
    "name": "Project Task Gantt (Community)",
    "summary": "Visualiza tareas en un diagrama de Gantt sin Enterprise",
    "version": "17.0.1.0.0",
    "category": "Project",
    "license": "LGPL-3",
    "author": "Tu Organización",
    "depends": ["web", "project"],
    "data": [
        "views/project_task_views.xml",
        "views/gantt_action.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "project_gantt_community/static/lib/frappe-gantt/frappe-gantt.css",
            "project_gantt_community/static/lib/frappe-gantt/frappe-gantt.umd.js",
            "project_gantt_community/static/src/js/gantt.js",
            "project_gantt_community/static/src/xml/gantt.xml",
            "project_gantt_community/static/src/scss/gantt.scss",
        ],
    },
    "installable": True,
    "application": False,
}
