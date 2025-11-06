from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class ProjectTask(models.Model):
    _inherit = "project.task"

    gantt_start_date = fields.Datetime(string="Gantt Start")
    gantt_end_date = fields.Datetime(string="Gantt End")

    @api.constrains("gantt_start_date", "gantt_end_date")
    def _check_gantt_dates(self):
        for rec in self:
            if rec.gantt_start_date and rec.gantt_end_date and rec.gantt_end_date < rec.gantt_start_date:
                raise ValidationError(_("The Gantt End must be after the Gantt Start."))
