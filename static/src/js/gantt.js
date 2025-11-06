/** @odoo-module */

import { Component, onWillStart, onMounted, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { DateTime } from "luxon";
import { serializeDateTime } from "@web/core/l10n/dates";

class ProjectGanttClient extends Component {
    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        this.notification = useService("notification");

        this.state = useState({
            projects: [],
            project_id: 0, // 0 = todos
            date_from: this._fmt(DateTime.now().startOf("month")),
            date_to: this._fmt(DateTime.now().endOf("month")),
            view_mode: "Month",
            tasks: [],
        });

        onWillStart(async () => {
            await this._loadProjects();
            await this._loadTasks();
        });

        onMounted(() => this._renderGantt());
    }

    _fmt(dt) {
        return dt.toFormat("yyyy-LL-dd");
    }

    async _loadProjects() {
        this.state.projects = await this.orm.searchRead("project.project", [], ["id", "name"], { limit: 10000 });
    }

    _domain() {
        const domain = [
            ["gantt_start_date", "!=", false],
            ["gantt_end_date", "!=", false],
            ["gantt_end_date", ">=", this.state.date_from + " 00:00:00"],
            ["gantt_start_date", "<=", this.state.date_to + " 23:59:59"],
        ];
        if (Number(this.state.project_id)) {
            domain.push(["project_id", "=", Number(this.state.project_id)]);
        }
        return domain;
    }

    async _loadTasks() {
        const recs = await this.orm.searchRead(
            "project.task",
            this._domain(),
            ["name", "gantt_start_date", "gantt_end_date", "progress", "project_id"],
            { limit: 10000 }
        );
        this.state.tasks = recs.map((t) => ({
            id: t.id,
            name: t.name,
            // Odoo devuelve UTC en string; lo convertimos a Date UTC
            start: new Date(t.gantt_start_date.replace(" ", "T") + "Z"),
            end: new Date(t.gantt_end_date.replace(" ", "T") + "Z"),
            progress: t.progress || 0,
            custom_class: "pgc-task-" + (t.project_id ? t.project_id[0] : "none"),
        }));
        if (this.gantt) {
            this.gantt.refresh(this.state.tasks);
            this.gantt.change_view_mode(this.state.view_mode);
        }
    }

    _renderGantt() {
        if (!window.Gantt) {
            this.notification.add("No se pudo cargar la librería de Gantt (frappe-gantt).", { type: "danger" });
            return;
        }
        const options = {
            view_mode: this.state.view_mode,
            bar_height: 24,
            padding: 18,
            column_width: 36,
            custom_popup_html: (task) => `
                <div class="details-container">
                  <h5>${task.name}</h5>
                  <p>Inicio: ${task._start.toISOString().slice(0,16).replace('T',' ')}</p>
                  <p>Fin: ${task._end.toISOString().slice(0,16).replace('T',' ')}</p>
                  <p>Progreso: ${task.progress || 0}%</p>
                </div>
            `,
            on_click: (task) => {
                this.action.doAction({
                    type: "ir.actions.act_window",
                    res_model: "project.task",
                    res_id: task.id,
                    views: [[false, "form"]],
                    target: "current",
                });
            },
            on_date_change: async (task, start, end) => {
                try {
                    const startStr = serializeDateTime(DateTime.fromJSDate(start));
                    const endStr = serializeDateTime(DateTime.fromJSDate(end));
                    await this.orm.write("project.task", [task.id], {
                        gantt_start_date: startStr,
                        gantt_end_date: endStr,
                    });
                    this.notification.add("Fechas actualizadas.", { type: "success" });
                } catch {
                    this.notification.add("No se pudo actualizar la tarea.", { type: "danger" });
                    await this._loadTasks();
                }
            },
        };
        this.gantt = new window.Gantt(this.refs.gantt, this.state.tasks, options);
    }

    async reload() {
        await this._loadTasks();
        if (this.gantt) this.gantt.change_view_mode(this.state.view_mode);
    }

    setViewMode(ev) {
        const mode = ev.currentTarget.dataset.mode;
        this.state.view_mode = mode;
        if (this.gantt) this.gantt.change_view_mode(mode);
    }

    async onProjectChange(ev) {
        this.state.project_id = Number(ev.currentTarget.value || 0);
        await this._loadTasks();
    }

    async onDateChange() {
        await this._loadTasks();
    }
}

ProjectGanttClient.template = "project_gantt_community.GanttClientAction";
registry.category("actions").add("project_gantt_community.gantt_client", ProjectGanttClient);
