/**
 * This class implements the Navigation data bar (also referred to as navigation status bar) found on Garmin units.
 * It has support for an arbitrary number of data bar fields.
 */
class WT_NavDataBarModel {
    /**
     * @param {WT_FlightPlanManager} flightPlanManager
     */
    constructor(flightPlanManager) {
        this._fpm = flightPlanManager;

        this._dataFieldCount = 0;
        this._dataFields = [];

        this._initInfos();
    }

    _initInfos() {
        let flightPlanManager = this._fpm;
        let airplaneModel = WT_PlayerAirplane.INSTANCE;

        this._infos = {
            BRG: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.BRG, new WT_NavAngleModelSimVar(true, {
                updateLocation(location) {
                    airplaneModel.navigation.position(location);
                }
            }, "PLANE HEADING DEGREES MAGNETIC", "degree")),
            DIS: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.DIS, new WT_NumberUnitModelSimVar(WT_Unit.NMILE, "GPS WP DISTANCE", "nautical miles")),
            DTG: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.DTG, new WT_NumberUnitModelAutoUpdated(WT_Unit.NMILE, {
                updateValue(value) {
                    return flightPlanManager.directTo.isActive() ? flightPlanManager.distanceToDirectTo(true, value) : flightPlanManager.distanceToDestination(true, value);
                }
            })),
            DTK: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.DTK, new WT_NavAngleModelSimVar(true, {
                updateLocation(location) {
                    airplaneModel.navigation.position(location);
                }
            }, "GPS WP DESIRED TRACK", "degree")),
            END: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.END, new WT_NumberUnitModelAutoUpdated(WT_Unit.HOUR, {
                tempGal: new WT_NumberUnit(0, WT_Unit.GALLON),
                tempGPH: new WT_NumberUnit(0, WT_Unit.GPH),
                updateValue(value) {
                    let fuelRemaining = airplaneModel.engineering.fuelOnboard(this.tempGal);
                    let fuelFlow = airplaneModel.engineering.fuelFlowTotal(this.tempGPH);
                    if (fuelFlow.number == 0) {
                        value.set(0);
                    } else {
                        value.set(fuelRemaining.number / fuelFlow.number);
                    }
                }
            })),
            ENR: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.ENR, new WT_NumberUnitModelSimVar(WT_Unit.SECOND, "GPS ETE", "seconds")),
            ETA: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.ETA, new WT_NumberUnitModelAutoUpdated(WT_Unit.SECOND, {
                updateValue(value) {
                    let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                    let ete = SimVar.GetSimVarValue("GPS WP ETE", "seconds");
                    value.set((currentTime + ete) % (24 * 3600));
                }
            })),
            ETE: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.ETE, new WT_NumberUnitModelSimVar(WT_Unit.SECOND, "GPS WP ETE", "seconds")),
            FOB: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.FOB, new WT_NumberUnitModelSimVar(WT_Unit.GALLON, "FUEL TOTAL QUANTITY", "gallons")),
            FOD: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.FOD, new WT_NumberUnitModelAutoUpdated(WT_Unit.GALLON, {
                tempGal: new WT_NumberUnit(0, WT_Unit.GALLON),
                tempGPH: new WT_NumberUnit(0, WT_Unit.GPH),
                updateValue(value) {
                    let fuelRemaining = airplaneModel.engineering.fuelOnboard(this.tempGal);
                    let fuelFlow = airplaneModel.engineering.fuelFlowTotal(this.tempGPH);
                    let enr = SimVar.GetSimVarValue("GPS ETE", "seconds") / 3600;
                    value.set(fuelRemaining.number - enr * fuelFlow.number);
                }
            })),
            GS: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.GS, new WT_NumberUnitModelSimVar(WT_Unit.KNOT, "GPS GROUND SPEED", "knots")),
            LDG: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.LDG, new WT_NumberUnitModelAutoUpdated(WT_Unit.SECOND, {
                updateValue(value) {
                    let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                    let enr = SimVar.GetSimVarValue("GPS ETE", "seconds");
                    value.set((currentTime + enr) % (24 * 3600));
                }
            })),
            TAS: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.TAS, new WT_NumberUnitModelSimVar(WT_Unit.KNOT, "AIRSPEED TRUE", "knots")),
            TKE: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.TKE, new WT_NumberUnitModelSimVar(WT_Unit.DEGREE, "GPS WP TRACK ANGLE ERROR", "degree")),
            TRK: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.TRK, new WT_NavAngleModelSimVar(true, {
                updateLocation(location) {
                    airplaneModel.navigation.position(location);
                }
            }, "GPS GROUND MAGNETIC TRACK", "degree")),
            XTK: new WT_NavDataInfoNumber(WT_NavDataBarModel.INFO_DESCRIPTION.XTK, new WT_NumberUnitModelSimVar(WT_Unit.METER, "GPS WP CROSS TRK", "meters"))
        };
    }

    /**
     * @readonly
     * @property {Number} dataFieldCount - the number of data fields this nav data bar contains.
     * @type {Number}
     */
    get dataFieldCount() {
        return this._dataFieldCount;
    }

    /**
     * Gets an array of all of this nav data bar's data info objects.
     * @returns {WT_NavDataInfo[]} an array of all of this nav data bar's data info objects.
     */
    getAllNavDataInfo() {
        return Object.getOwnPropertyNames(this._infos).map(id => this._infos[id]);
    }

    /**
     * Gets one of this nav data bar's nav data info objects by its ID.
     * @param {String} id - a string ID.
     * @returns {WT_NavDataInfo} the nav data info object matching the supplied ID.
     */
    getNavDataInfo(id) {
        return this._infos[id];
    }

    /**
     * Sets the number of data fields this nav data bar contains. If the count is set to a value less than the current number
     * of data fields, the excess fields will be deleted, beginning with those located at the highest indexes.
     * @param {Number} count - the new count.
     */
    setDataFieldCount(count) {
        this._dataFieldCount = count;
        if (count > this._dataFields.length) {
            this._dataFields.splice(count, this._dataFields.length - count);
        }
    }

    /**
     * Gets the nav data info object assigned to a data field.
     * @param {Number} index - the index of the data field.
     * @returns {WT_NavDataInfo} a nava data info object.
     */
    getDataFieldInfo(index) {
        return this._dataFields[index];
    }

    /**
     * Assigns a nav data info object to a data field.
     * @param {Number} index - the index of the data field.
     * @param {WT_NavDataInfo} info - the nav data info object to assign.
     */
    setDataFieldInfo(index, info) {
        if (index < 0 || index >= this._dataFieldCount) {
            return;
        }

        this._dataFields[index] = info;
    }
}
WT_NavDataBarModel.INFO_DESCRIPTION = {
    BRG: {shortName: "BRG", longName: "Bearing"},
    DIS: {shortName: "DIS", longName: "Distance to Next Waypoint"},
    DTG: {shortName: "DTG", longName: "Distance to Destination"},
    DTK: {shortName: "DTK", longName: "Desired Track"},
    END: {shortName: "END", longName: "Endurance"},
    ENR: {shortName: "ENR", longName: "ETE To Destination"},
    ETA: {shortName: "ETA", longName: "Estimated Time of Arrival"},
    ETE: {shortName: "ETE", longName: "Estimated Time Enroute"},
    FOB: {shortName: "FOB", longName: "Fuel Onboard"},
    FOD: {shortName: "FOD", longName: "Fuel over Destination"},
    GS: {shortName: "GS", longName: "Groundspeed"},
    LDG: {shortName: "LDG", longName: "ETA at Final Destination"},
    TAS: {shortName: "TAS", longName: "True Airspeed"},
    TKE: {shortName: "TKE", longName: "Track Angle Error"},
    TRK: {shortName: "TRK", longName: "Track"},
    XTK: {shortName: "XTK", longName: "Cross-track Error"},
};

class WT_NavDataBarView extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_NavDataBarView.TEMPLATE.content.cloneNode(true));

        this._fieldViewRecycler = new WT_NavDataInfoViewRecycler(this);
        /**
         * @type {WT_NavDataInfoView[]}
         */
        this._fieldViews = [];

        this._model = null;

        this._isInit = false;
    }

    /**
     * @readonly
     * @property {WT_NavDataBar} model
     * @type {WT_NavDataBarModel}
     */
    get model() {
        return this._model;
    }

    _initFormatters() {
        let bearingOpts = {
            precision: 1,
            unitSpaceBefore: false
        };
        let bearingFormatter = new WT_NumberFormatter(bearingOpts);

        let distanceOpts = {
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        }
        let distanceFormatter = new WT_NumberFormatter(distanceOpts);

        let volumeOpts = {
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        }
        let volumeFormatter = new WT_NumberFormatter(volumeOpts);

        let speedOpts = {
            precision: 1,
            unitSpaceBefore: false,
            unitCaps: true
        }
        let speedFormatter = new WT_NumberFormatter(speedOpts);

        let timeOpts = {
            timeFormat: WT_TimeFormatter.Format.HH_MM_OR_MM_SS,
            delim: WT_TimeFormatter.Delim.COLON_OR_CROSS
        }
        let timeFormatter = new WT_TimeFormatter(timeOpts);

        let utcOpts = {
            timeFormat: WT_TimeFormatter.Format.HH_MM
        }
        let utcFormatter = new WT_TimeFormatter(utcOpts);

        this._formatters = {
            BRG: new WT_NavDataInfoViewDegreeFormatter(bearingFormatter),
            DIS: new WT_NavDataInfoViewNumberFormatter(distanceFormatter),
            DTG: new WT_NavDataInfoViewNumberFormatter(distanceFormatter),
            DTK: new WT_NavDataInfoViewDegreeFormatter(bearingFormatter),
            END: new WT_NavDataInfoViewTimeFormatter(timeFormatter, "__:__"),
            ENR: new WT_NavDataInfoViewTimeFormatter(timeFormatter, "__:__", {isDefault: value => value.equals(0)}),
            ETA: new WT_NavDataInfoViewUTCFormatter(utcFormatter),
            ETE: new WT_NavDataInfoViewTimeFormatter(timeFormatter, "__:__", {isDefault: value => value.equals(0)}),
            FOB: new WT_NavDataInfoViewNumberFormatter(volumeFormatter),
            FOD: new WT_NavDataInfoViewNumberFormatter(volumeFormatter),
            GS: new WT_NavDataInfoViewNumberFormatter(speedFormatter),
            LDG: new WT_NavDataInfoViewUTCFormatter(utcFormatter),
            TAS: new WT_NavDataInfoViewNumberFormatter(speedFormatter),
            TKE: new WT_NavDataInfoViewDegreeFormatter(bearingFormatter),
            TRK: new WT_NavDataInfoViewDegreeFormatter(bearingFormatter),
            XTK: new WT_NavDataInfoViewNumberFormatter(distanceFormatter),
        };
    }

    _defineChildren() {
        this._fields = this.shadowRoot.querySelector(`#fields`);
    }

    connectedCallback() {
        this._initFormatters();
        this._defineChildren();
        this._updateModel();
        this._isInit = true;
    }

    _updateModel() {
        this._fieldViewRecycler.recycleAll();
        this._fieldViews = [];

        if (!this.model) {
            return;
        }

        for (let i = 0; i < this.model.dataFieldCount; i++) {
            this._fieldViews.push(this._fieldViewRecycler.request());
        }
    }

    /**
     * Sets the nav data bar model for this view.
     * @param {WT_NavDataBarModel} model - a nav data bar model.
     */
    setModel(model) {
        if (this.model === model) {
            return;
        }

        this._model = model;
        if (this._isInit) {
            this._updateModel();
        }
    }

    update() {
        for (let i = 0; i < this._fieldViews.length; i++) {
            let navDataInfo = this.model.getDataFieldInfo(i);
            this._fieldViews[i].update(navDataInfo, this._formatters[navDataInfo.shortName]);
        }
    }
}
WT_NavDataBarView.NAME = "wt-navdatabar-view";
WT_NavDataBarView.TEMPLATE = document.createElement("template");
WT_NavDataBarView.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
            text-align: left;
        }

        #fields {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: repeat(auto-fit, minmax(10px, 1fr));
        }
    </style>
    <slot name="fields" id="fields"></slot>
`;

customElements.define(WT_NavDataBarView.NAME, WT_NavDataBarView);

class WT_NavDataBarController extends WT_DataStoreController {
    /**
     * Creates and adds a data field setting to this controller. The index of the setting is automatically set to the next available
     * index based on the number of settings already added to this controller.
     * @param {String} defaultValue - the default value of the setting to add.
     * @returns {WT_NavDataBarFieldSetting} the setting that was added.
     */
    addDataFieldSetting(defaultValue) {
        let setting = new WT_NavDataBarFieldSetting(this, this._settings.length, defaultValue);
        this.addSetting(setting);
        return setting;
    }

    /**
     * Gets the setting for the data field at the specified index.
     * @param {Number} index - the index of the data field.
     * @returns {WT_NavDataBarFieldSetting} a data field setting.
     */
    getDataFieldSetting(index) {
        return this._settings[index];
    }
}

class WT_NavDataBarFieldSetting extends WT_DataStoreSetting {
    constructor(controller, index, defaultValue, autoUpdate = true, isPersistent = true, keyRoot = WT_NavDataBarFieldSetting.KEY_ROOT) {
        super(controller, `${keyRoot}_${index}`, defaultValue, autoUpdate, isPersistent);

        this._index = index;
    }

    /**
     * @readonly
     * @property {Number} index - the index of the nav data field this setting controls.
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    update() {
        this.model.setDataFieldInfo(this._index, this.model.getNavDataInfo(this.getValue()));
    }
}
WT_NavDataBarFieldSetting.KEY_ROOT = "WT_NavDataBar_FieldAssignment";