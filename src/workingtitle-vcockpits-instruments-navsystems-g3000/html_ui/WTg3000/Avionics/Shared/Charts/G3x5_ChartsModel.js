class WT_G3x5_ChartsModel {
    constructor(navigraphAPI) {
        this._navigraphAPI = navigraphAPI;
        this._navigraphStatus = WT_G3x5_ChartsModel.NavigraphStatus.UNLINKED;

        this._chartID = "";
        this._airportIdent = "";
        this._airportCharts = [];
        this._airportChartsReadOnly = new WT_ReadOnlyArray(this._airportCharts);
        this._chart = null;
        this._chartDayURL = "";
        this._chartNightURL = "";

        this._offset = new WT_GVector2(0, 0);

        this._taskID = 0;

        this._optsManager = new WT_OptionsManager(this, WT_G3x5_ChartsModel.OPTION_DEFS);
        this._checkNavigraphStatus();
    }

    _checkNavigraphStatus() {
        this._navigraphStatus = this.navigraphAPI.isAccountLinked ? WT_G3x5_ChartsModel.NavigraphStatus.LINKED : WT_G3x5_ChartsModel.NavigraphStatus.UNLINKED;
    }

    /**
     * @readonly
     * @type {WT_NavigraphAPI}
     */
    get navigraphAPI() {
        return this._navigraphAPI;
    }

    async _retrieveCharts(ident) {
        try {
            let response = await this.navigraphAPI.getChartsList(ident);
            if (response) {
                return response.charts;
            }
        } catch (e) {
            console.log(e);
        }
        return [];
    }

    async _retrieveChartURLs(chart) {
        try {
            let urls = await Promise.all([this.navigraphAPI.getChartPngUrl(chart, true), this.navigraphAPI.getChartPngUrl(chart, false)]);
            return urls;
        } catch (e) {
            console.log(e);
        }
        return ["", ""];
    }

    async _updateCharts() {
        let taskID = ++this._taskID;
        let charts = await this._retrieveCharts(this._airportIdent);
        let chart = charts.find(chart => chart.id === this._chartID, this);
        if (chart) {
            [this._chartDayURL, this._chartNightURL] = await this._retrieveChartURLs(chart);
        } else {
            this._chartDayURL = "";
            this._chartNightURL = "";
        }

        if (taskID !== this._taskID) {
            return;
        }

        this._airportCharts = charts;
        this._airportChartsReadOnly = new WT_ReadOnlyArray(this._airportCharts);
        this._chart = chart ? chart : null;
    }

    get chartID() {
        return this._chartID;
    }

    set chartID(id) {
        if (id === this._chartID) {
            return;
        }

        this._chartID = id;
        this._airportIdent = id ? id.substring(0, 4) : "";
        this._updateCharts();
    }

    /**
     * @readonly
     * @type {String}
     */
    get airportIdent() {
        return this._airportIdent;
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_NavigraphChartDefinition>}
     */
    get airportCharts() {
        return this._airportChartsReadOnly;
    }

    /**
     * @readonly
     * @type {WT_NavigraphChartDefinition}
     */
    get chart() {
        return this._chart;
    }

    /**
     * @readonly
     * @type {String}
     */
    get chartDayViewURL() {
        return this._chartDayURL;
    }

    /**
     * @readonly
     * @type {String}
     */
    get chartNightViewURL() {
        return this._chartNightURL;
    }

    /**
     * @type {WT_GVector2}
     */
    get offset() {
        return this._offset.readonly();
    }

    set offset(offset) {
        this._offset.set(offset);
    }
}
WT_G3x5_ChartsModel.NAME_DEFAULT = "charts";
/**
 * @enum {Number}
 */
WT_G3x5_ChartsModel.NavigraphStatus = {
    UNLINKED: 0,
    LINKED: 1
};
WT_G3x5_ChartsModel.OPTION_DEFS = {
    chartID: {default: ""},
    useNightView: {default: false, auto: true},
    usePlanView: {default: true, auto: true},
    rotation: {default: 0, auto: true},
    scaleFactor: {default: 1, auto: true}
};