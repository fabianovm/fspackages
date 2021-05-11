class WT_G3x5_TSCFlightPlan extends WT_G3x5_TSCPageElement {
    /**
     * @param {String} homePageGroup
     * @param {String} homePageName
     */
    constructor(homePageGroup, homePageName, instrumentID) {
        super(homePageGroup, homePageName);

        this._instrumentID = instrumentID;

        /**
         * @type {WT_G3x5_TSCFlightPlanState}
         */
        this._state = {
            _unitsModel: null,
            _settings: null,
            _airplaneHeadingTrue: 0,
            _activeLeg: null,

            get unitsModel() {
                return this._unitsModel;
            },

            get settings() {
                return this._settings;
            },

            get airplaneHeadingTrue() {
                return this._airplaneHeadingTrue;
            },

            get activeLeg() {
                return this._activeLeg;
            }
        };

        this._drctWaypoint = null;

        this._initSettings();
    }

    _initSettings() {
        this._settings = new WT_G3x5_TSCFlightPlanSettings(this._instrumentID);
        this._settings.init();

        this._state._settings = this._settings;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlanSettings}
     */
    get settings() {
        return this._settings;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlanHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCFlightPlanHTMLElement();
    }

    _initHTMLElement() {
        this.htmlElement.setParentPage(this);
        this._setDisplayedFlightPlan(this._fpm.activePlan);
    }

    _initButtonListener() {
        this.htmlElement.addButtonListener(this._onButtonPressed.bind(this));
    }

    init(root) {
        this._fpm = this.instrument.flightPlanManagerWT;
        this._state._unitsModel = new WT_G3x5_TSCFlightPlanUnitsModel(this.instrument.unitsSettingModel);

        this.container.title = WT_G3x5_TSCFlightPlan.TITLE;
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initHTMLElement();
        this._initButtonListener();
    }

    _setDisplayedFlightPlan(flightPlan) {
        this.htmlElement.setFlightPlan(flightPlan);
    }

    async _selectOrigin(icao) {
        if (icao === "") {
            return;
        }

        try {
            await this._fpm.setActiveOriginICAO(icao);
        } catch (e) {
            console.log(e);
        }
    }

    async _selectDestination(icao) {
        if (icao === "") {
            return;
        }

        try {
            await this._fpm.setActiveDestinationICAO(icao);
        } catch (e) {
            console.log(e);
        }
    }

    async _removeOrigin() {
        await this._fpm.removeActiveOrigin();
    }

    async _removeDestination() {
        await this._fpm.removeActiveDestination();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {Number} deltaIndex
     * @param {String} icao
     */
    async _insertWaypoint(leg, deltaIndex, icao) {
        if (icao === "" || leg.flightPlan !== this._fpm.activePlan) {
            return;
        }

        try {
            let legSegmentIndex = leg.index - leg.flightPlan.getSegment(leg.segment).legs.first().index;
            await this._fpm.addWaypointICAOToActive(leg.segment, icao, legSegmentIndex + deltaIndex);
        } catch (e) {
            console.log(e);
        }
    }

    async _appendToEnroute(icao) {
        if (icao === "") {
            return;
        }

        try {
            await this._fpm.addWaypointICAOToActive(WT_FlightPlan.Segment.ENROUTE, icao);
        } catch (e) {
            console.log(e);
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_Airway} airway
     * @param {WT_ICAOWaypoint[]} waypointSequence
     */
    async _insertAirway(leg, airway, waypointSequence) {
        if (leg.flightPlan !== this._fpm.activePlan) {
            return;
        }

        let enter = waypointSequence[0];
        let exit = waypointSequence[waypointSequence.length - 1];
        if (enter.equals(leg.fix)) {
            enter = waypointSequence[1];
        }

        try {
            let segmentElement = leg.flightPlan.getSegment(leg.segment);
            let index;
            if (leg.parent instanceof WT_FlightPlanAirwaySequence) {
                index = segmentElement.elements.indexOf(leg.parent);
            } else {
                index = segmentElement.elements.indexOf(leg);
            }
            if (index >= 0) {
                await this._fpm.addAirwaySequenceToActive(leg.segment, airway, enter, exit, index + 1);
            }
        } catch (e) {
            console.log(e);
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    async _removeLeg(leg) {
        try {
            switch (leg.segment) {
                case WT_FlightPlan.Segment.ORIGIN:
                    await this._fpm.removeActiveOrigin();
                    break;
                case WT_FlightPlan.Segment.ENROUTE:
                    await this._fpm.removeFromActive(leg);
                    break;
                case WT_FlightPlan.Segment.DESTINATION:
                    await this._fpm.removeActiveDestination();
                    break;
            }
        } catch (e) {
            console.log(e);
        }
    }

    /**
     *
     * @param {WT_FlightPlanAirwaySequence} sequence
     */
    async _removeAirwaySequence(sequence) {
        try {
            if (sequence.segment === WT_FlightPlan.Segment.ENROUTE) {
                await this._fpm.removeFromActive(sequence);
            }
        } catch (e) {
            console.log(e);
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    async _activateLeg(leg) {
        try {
            await this._fpm.setActiveLeg(leg);
        } catch (e) {
            console.log(e);
        }
    }

    _openWaypointKeyboard(callback) {
        this.instrument.deactivateNavButton(5);
        this.instrument.deactivateNavButton(6);
        this.instrument.fullKeyboard.element.setContext(callback);
        this.instrument.switchToPopUpPage(this.instrument.fullKeyboard);
    }

    _openPage(pageGroup, pageName) {
        this.instrument.SwitchToPageName(pageGroup, pageName);
    }

    _openDRCTPage(waypoint) {
        this._drctWaypoint = waypoint;
        this.instrument.SwitchToPageName("MFD", "Direct To");
    }

    _openWaypointInfoPage(waypoint) {
        if (!waypoint || !(waypoint instanceof WT_ICAOWaypoint)) {
            return;
        }

        let infoPage;
        let pages = this.instrument.getSelectedMFDPanePages();
        switch (waypoint.type) {
            case WT_ICAOWaypoint.Type.AIRPORT:
                infoPage = pages.airportInfo;
                break;
            case WT_ICAOWaypoint.Type.VOR:
                infoPage = pages.vorInfo;
                break;
            case WT_ICAOWaypoint.Type.NDB:
                infoPage = pages.ndbInfo;
                break;
            case WT_ICAOWaypoint.Type.INT:
                infoPage = pages.intInfo;
                break;
        }
        if (infoPage) {
            infoPage.element.setWaypoint(waypoint);
            this.instrument.SwitchToPageName("MFD", infoPage.name);
        }
    }

    _openFlightPlanOptionsPopUp() {
        this.instrument.flightPlanOptions.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            settings: this.settings
        });
        this.instrument.switchToPopUpPage(this.instrument.flightPlanOptions);
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    _openAirwaySelectPopUp(leg) {
        this.instrument.airwaySelection.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            entryWaypoint: leg.fix,
            callback: this._insertAirway.bind(this, leg)
        });
        this.instrument.switchToPopUpPage(this.instrument.airwaySelection);
    }

    _setAirwaySequenceCollapse(airwaySequence, value) {
        this.htmlElement.setAirwaySequenceCollapse(airwaySequence, value);
    }

    _setAllAirwaySequenceCollapse(value) {
        this._fpm.activePlan.getEnroute().elements.forEach(element => {
            if (element instanceof WT_FlightPlanAirwaySequence) {
                this.htmlElement.setAirwaySequenceCollapse(element, value);
            }
        });
    }

    _onDRCTButtonPressed(event) {
        let selectedRow = this.htmlElement.getSelectedRow();
        let selectedRowModeHTMLElement = selectedRow ? selectedRow.getActiveModeHTMLElement() : null;
        let waypoint = null;
        if (selectedRow && selectedRowModeHTMLElement.leg) {
            waypoint = selectedRowModeHTMLElement.leg.fix;
        }
        this._openDRCTPage(waypoint);
    }

    _onProcButtonPressed(event) {
        this._openPage("MFD", "Procedures");
    }

    _onFlightPlanOptionsButtonPressed(event) {
        this._openFlightPlanOptionsPopUp();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onOriginHeaderButtonPressed(event) {
        let flightPlan = this._fpm.activePlan;
        if (!flightPlan.hasOrigin()) {
            this._openWaypointKeyboard(this._selectOrigin.bind(this));
        } else {
            this.htmlElement.toggleRowSelection(event.row);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onDestinationHeaderButtonPressed(event) {
        let flightPlan = this._fpm.activePlan;
        if (!flightPlan.hasDestination()) {
            this._openWaypointKeyboard(this._selectDestination.bind(this));
        } else {
            this.htmlElement.toggleRowSelection(event.row);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onAirwaySequenceHeaderButtonPressed(event) {
        this.htmlElement.toggleRowSelection(event.row);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onHeaderButtonPressed(event) {
        let flightPlan = this._fpm.activePlan;
        if (event.sequence === flightPlan.getOrigin() || event.sequence === flightPlan.getDeparture()) {
            this._onOriginHeaderButtonPressed(event);
        } else if (event.sequence === flightPlan.getDestination() || event.sequence === flightPlan.getArrival()) {
            this._onDestinationHeaderButtonPressed(event);
        } else if (event.sequence instanceof WT_FlightPlanAirwaySequence) {
            this._onAirwaySequenceHeaderButtonPressed(event);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onLegWaypointButtonPressed(event) {
        this.htmlElement.toggleRowSelection(event.row);
    }

    _onEnrouteAddButtonPressed(event) {
        this._openWaypointKeyboard(this._appendToEnroute.bind(this));
    }

    _onOriginSelectButtonPressed(event) {
        this._openWaypointKeyboard(this._selectOrigin.bind(this));
    }

    _onDepartureSelectButtonPressed(event) {
        this._openPage("MFD", "Departure Selection");
    }

    _onOriginRemoveButtonPressed(event) {
        this._removeOrigin();
    }

    _onOriginInfoButtonPressed(event) {
        let origin = this._fpm.activePlan.getOrigin().waypoint;
        this._openWaypointInfoPage(origin);
    }

    _onDestinationSelectButtonPressed(event) {
        this._openWaypointKeyboard(this._selectDestination.bind(this));
    }

    _onArrivalSelectButtonPressed(event) {
        this._openPage("MFD", "Arrival Selection");
    }

    _onApproachSelectButtonPressed(event) {
        this._openPage("MFD", "Approach Selection");
    }

    _onDestinationRemoveButtonPressed(event) {
        this._removeDestination();
    }

    _onDestinationInfoButtonPressed(event) {
        let destination = this._fpm.activePlan.getDestination().waypoint;
        this._openWaypointInfoPage(destination);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onInsertBeforeButtonPressed(event) {
        this._openWaypointKeyboard(this._insertWaypoint.bind(this, event.leg, 0));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onInsertAfterButtonPressed(event) {
        this._openWaypointKeyboard(this._insertWaypoint.bind(this, event.leg, 1));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onWaypointDRCTButtonPressed(event) {
        this._openDRCTPage(event.leg.fix);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onActivateLegButtonPressed(event) {
        this._activateLeg(event.leg);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onLoadAirwayButtonPressed(event) {
        this._openAirwaySelectPopUp(event.leg);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onWaypointRemoveButtonPressed(event) {
        this._removeLeg(event.leg);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onWaypointInfoButtonPressed(event) {
        this._openWaypointInfoPage(event.leg.fix);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onAirwayCollapseButtonPressed(event) {
        this._setAirwaySequenceCollapse(event.sequence, true);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
     _onAirwayExpandButtonPressed(event) {
        this._setAirwaySequenceCollapse(event.sequence, false);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onAirwayCollapseAllButtonPressed(event) {
        this._setAllAirwaySequenceCollapse(true);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
     _onAirwayExpandAllButtonPressed(event) {
        this._setAllAirwaySequenceCollapse(false);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onAirwayRemoveButtonPressed(event) {
        this._removeAirwaySequence(event.sequence);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onButtonPressed(event) {
        switch (event.type) {
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DRCT:
                this._onDRCTButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.PROC:
                this._onProcButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.FLIGHT_PLAN_OPTIONS:
                this._onFlightPlanOptionsButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.HEADER:
                this._onHeaderButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_WAYPOINT:
                this._onLegWaypointButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ENROUTE_ADD:
                this._onEnrouteAddButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_SELECT:
                this._onOriginSelectButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DEPARTURE_SELECT:
                this._onDepartureSelectButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_REMOVE:
                this._onOriginRemoveButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_INFO:
                this._onOriginInfoButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_SELECT:
                this._onDestinationSelectButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ARRIVAL_SELECT:
                this._onArrivalSelectButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.APPROACH_SELECT:
                this._onApproachSelectButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_REMOVE:
                this._onDestinationRemoveButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_INFO:
                this._onDestinationInfoButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.INSERT_BEFORE:
                this._onInsertBeforeButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.INSERT_AFTER:
                this._onInsertAfterButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_DRCT:
                this._onWaypointDRCTButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ACTIVATE_LEG:
                this._onActivateLegButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LOAD_AIRWAY:
                this._onLoadAirwayButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_REMOVE:
                this._onWaypointRemoveButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_INFO:
                this._onWaypointInfoButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_COLLAPSE:
                this._onAirwayCollapseButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_EXPAND:
                this._onAirwayExpandButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_COLLAPSE_ALL:
                this._onAirwayCollapseAllButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_EXPAND_ALL:
                this._onAirwayExpandAllButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_REMOVE:
                this._onAirwayRemoveButtonPressed(event);
                break;
        }
    }

    _activateNavButtons() {
        super._activateNavButtons();

        this.instrument.activateNavButton(5, "Up", this._onUpPressed.bind(this), true, "ICON_TSC_BUTTONBAR_UP.png");
        this.instrument.activateNavButton(6, "Down", this._onDownPressed.bind(this), true, "ICON_TSC_BUTTONBAR_DOWN.png");
    }

    _deactivateNavButtons() {
        super._deactivateNavButtons();

        this.instrument.deactivateNavButton(5);
        this.instrument.deactivateNavButton(6);
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.open();
    }

    _updateState() {
        this._state._airplaneHeadingTrue = this.instrument.airplane.navigation.headingTrue();
        this._state._activeLeg = this.instrument.flightPlanManagerWT.getActiveLeg(true);
    }

    onUpdate(deltaTime) {
        this._updateState();
        this.htmlElement.update(this._state);
    }

    _updateDirectTo() {
        // TODO: Implement a more sane way to push data to direct to page.
        this.instrument.lastRelevantICAO = (this._drctWaypoint && this._drctWaypoint instanceof WT_ICAOWaypoint) ? this._drctWaypoint.icao : null;
    }

    onExit() {
        super.onExit();

        this.htmlElement.close();
        this._updateDirectTo();
    }

    _onUpPressed() {
        this.htmlElement.scrollUp();
    }

    _onDownPressed() {
        this.htmlElement.scrollDown();
    }
}
WT_G3x5_TSCFlightPlan.SETTING_MODEL_ID = "GTC";
WT_G3x5_TSCFlightPlan.TITLE = "Active Flight Plan";

/**
 * @typedef WT_G3x5_TSCFlightPlanState
 * @property {readonly WT_G3x5_TSCFlightPlanUnitsModel} unitsModel
 * @property {readonly WT_G3x5_TSCFlightPlanSettings} settings
 * @property {readonly Number} airplaneHeadingTrue
 * @property {readonly WT_FlightPlanLeg} activeLeg
 */

class WT_G3x5_TSCFlightPlanUnitsModel extends WT_G3x5_UnitsSettingModelAdapter {
    /**
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     */
    constructor(unitsSettingModel) {
        super(unitsSettingModel);

        this._initListeners();
        this._initModel();
    }

    /**
     * @readonly
     * @type {WT_NavAngleUnit}
     */
    get bearingUnit() {
        return this._bearingUnit;
    }

    /**
     * @readonly
     * @type {WT_Unit}
     */
    get distanceUnit() {
        return this._distanceUnit;
    }

    /**
     * @readonly
     * @type {WT_Unit}
     */
    get altitudeUnit() {
        return this._altitudeUnit;
    }

    _updateBearing() {
        this._bearingUnit = this.unitsSettingModel.navAngleSetting.getNavAngleUnit();
    }

    _updateDistance() {
        this._distanceUnit = this.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
    }

    _updateAltitude() {
        this._altitudeUnit = this.unitsSettingModel.altitudeSetting.getAltitudeUnit();
    }
}

class WT_G3x5_TSCFlightPlanDataFieldSetting extends WT_DataStoreSetting {
    /**
     * @param {WT_DataStoreSettingModel} model
     * @param {Number} index
     * @param {WT_G3x5_TSCFlightPlanDataFieldSetting.Mode} defaultValue
     */
    constructor(model, index, defaultValue) {
        super(model, `${WT_G3x5_TSCFlightPlanDataFieldSetting.KEY}_${index}`, defaultValue, true, true);

        this._mode = this.getValue();
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlanDataFieldSetting.Mode}
     */
    get mode() {
        return this._mode;
    }

    update() {
        this._mode = this.getValue();
    }
}
WT_G3x5_TSCFlightPlanDataFieldSetting.KEY = "WT_FlightPlan_DataField";
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlanDataFieldSetting.Mode = {
    CUM: 0,
    DIS: 1,
    DTK: 2,
    ETA: 3,
    ETE: 4,
    FUEL: 5
};

class WT_G3x5_TSCFlightPlanSettings {
    constructor(instrumentID) {
        this._instrumentID = instrumentID;

        this._initSettings();
    }

    _initDataFieldSettings() {
        this._dataFieldSettings = new WT_ReadOnlyArray([...Array(2)].map((value, index) => new WT_G3x5_TSCFlightPlanDataFieldSetting(this._settingModel, index, WT_G3x5_TSCFlightPlanSettings.DATA_FIELD_DEFAULT_VALUES[index]), this));
    }

    _initNewAirwayCollapseSetting() {
        this._newAirwayCollapseSetting = new WT_DataStoreSetting(this._settingModel, WT_G3x5_TSCFlightPlanSettings.NEW_AIRWAY_COLLAPSE_KEY, true, false, true)
    }

    _initSettings() {
        this._settingModel = new WT_DataStoreSettingModel(this._instrumentID);

        this._initDataFieldSettings();
        this._initNewAirwayCollapseSetting();
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_G3x5_TSCFlightPlanDataFieldSetting>}
     */
    get dataFieldSettings() {
        return this._dataFieldSettings;
    }

    /**
     * @readonly
     * @type {WT_DataStoreSetting}
     */
    get newAirwayCollapseSetting() {
        return this._newAirwayCollapseSetting;
    }

    init() {
        this.dataFieldSettings.forEach(setting => setting.init());
        this.newAirwayCollapseSetting.init();
    }
}
WT_G3x5_TSCFlightPlanSettings.DATA_FIELD_DEFAULT_VALUES = [
    WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.DTK,
    WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.DIS
];
WT_G3x5_TSCFlightPlanSettings.NEW_AIRWAY_COLLAPSE_KEY = "WT_FlightPlan_NewAirway_Collapse";

class WT_G3x5_TSCFlightPlanHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._flightPlanListener = this._onFlightPlanChanged.bind(this);
        this._rowButtonListener = this._onRowButtonPressed.bind(this);

        /**
         * @type {Map<WT_FlightPlanAirwaySequence,Boolean>}
         */
        this._airwayCollapseMap = new Map();

        /**
         * @type {WT_G3x5_TSCFlightPlan}
         */
        this._parentPage = null;
        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        /**
         * @type {WT_G3x5_TSCFlightPlanRowHTMLElement[]}
         */
        this._visibleRows = [];
        this._selectedRow = null;
        this._activeArrowShow = null;
        this._activeArrowFrom = 0;
        this._activeArrowTo = 0;
        this._needRedrawFlightPlan = false;
        this._isInit = false;

        /**
         * @type {((event:WT_G3x5_TSCFlightPlanButtonEvent) => void)[]}
         */
        this._buttonListeners = [];
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlan}
     */
    get parentPage() {
        return this._parentPage;
    }

    async _defineOriginBannerButtons() {
        [
            this._originSelectButton,
            this._departureSelectButton,
            this._originRemoveButton,
            this._originInfoButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#originselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#departureselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#originremove`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#origininfo`, WT_TSCLabeledButton),
        ]);
    }

    async _defineDestinationBannerButtons() {
        [
            this._destinationSelectButton,
            this._arrivalSelectButton,
            this._approachSelectButton,
            this._destinationRemoveButton,
            this._destinationInfoButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#destinationselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#arrivalselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#approachselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#destinationremove`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#destinationinfo`, WT_TSCLabeledButton),
        ]);
    }

    async _defineWaypointBannerButtons() {
        [
            this._insertBeforeButton,
            this._insertAfterButton,
            this._waypointDRCTButton,
            this._activateLegButton,
            this._loadAirwayButton,
            this._waypointRemoveButton,
            this._waypointInfoButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#insertbefore`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#insertafter`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#waypointdrct`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#activateleg`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#loadairway`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#waypointremove`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#waypointinfo`, WT_TSCLabeledButton),
        ]);
    }

    async _defineAirwayBannerButtons() {
        [
            this._airwayCollapseButton,
            this._airwayExpandButton,
            this._airwayCollapseAllButton,
            this._airwayExpandAllButton,
            this._airwayLoadNewButton,
            this._airwayRemoveButton,
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#airwaycollapse`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#airwayexpand`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#collapseall`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#expandall`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#loadnewairways`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#airwayremove`, WT_TSCLabeledButton)
        ]);
    }

    async _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));

        this._nameTitle = this.shadowRoot.querySelector(`#nametitle`);
        this._dataFieldTitle = this.shadowRoot.querySelector(`#datafieldtitle`);

        [
            this._drctButton,
            this._procButton,
            this._flightPlanOptionsButton,
            this._rows,
            this._banner
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#drct`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#proc`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#fplnoptions`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#rows`, WT_TSCScrollList),
            WT_CustomElementSelector.select(this.shadowRoot, `#banner`, WT_TSCSlidingBanner),
            this._defineOriginBannerButtons(),
            this._defineDestinationBannerButtons(),
            this._defineWaypointBannerButtons(),
            this._defineAirwayBannerButtons()
        ]);

        this._rowsContainer = this.shadowRoot.querySelector(`#rowscontainer`);
        this._activeArrowStemRect = this.shadowRoot.querySelector(`#activearrowstem rect`);
        this._activeArrowHead = this.shadowRoot.querySelector(`#activearrowhead`);
    }

    _initLeftButtonListeners() {
        this._drctButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._drctButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DRCT
        }));
        this._procButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._procButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.PROC
        }));
        this._flightPlanOptionsButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._flightPlanOptionsButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.FLIGHT_PLAN_OPTIONS
        }));
    }

    _initOriginBannerButtonListeners() {
        this._originSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._originSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_SELECT
        }));
        this._departureSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._departureSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DEPARTURE_SELECT
        }));
        this._originRemoveButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._originRemoveButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_REMOVE
        }));
        this._originInfoButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._originInfoButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_INFO
        }));
    }

    _initDestinationBannerButtonListeners() {
        this._destinationSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._destinationSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_SELECT
        }));
        this._arrivalSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._arrivalSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ARRIVAL_SELECT
        }));
        this._approachSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._approachSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.APPROACH_SELECT
        }));
        this._destinationRemoveButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._destinationRemoveButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_REMOVE
        }));
        this._destinationInfoButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._destinationInfoButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_INFO
        }));
    }

    _initWaypointBannerButtonListeners() {
        this._insertBeforeButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.INSERT_BEFORE));
        this._insertAfterButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.INSERT_AFTER));
        this._waypointDRCTButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_DRCT));
        this._activateLegButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ACTIVATE_LEG));
        this._loadAirwayButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LOAD_AIRWAY));
        this._waypointRemoveButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_REMOVE));
        this._waypointInfoButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_INFO));
    }

    _initAirwayBannerButtonListeners() {
        this._airwayCollapseButton.addButtonListener(this._onAirwayBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_COLLAPSE));
        this._airwayExpandButton.addButtonListener(this._onAirwayBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_EXPAND));
        this._airwayCollapseAllButton.addButtonListener(this._onAirwayBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_COLLAPSE_ALL));
        this._airwayExpandAllButton.addButtonListener(this._onAirwayBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_EXPAND_ALL));
        this._airwayRemoveButton.addButtonListener(this._onAirwayBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_REMOVE));
    }

    _initButtonListeners() {
        this._initLeftButtonListeners();
        this._initOriginBannerButtonListeners();
        this._initDestinationBannerButtonListeners();
        this._initWaypointBannerButtonListeners();
        this._initAirwayBannerButtonListeners();
    }

    _initRowRecycler() {
        this._rowRecycler = new WT_CustomHTMLElementRecycler(this._rowsContainer, WT_G3x5_TSCFlightPlanRowHTMLElement, (element => element.setParentPage(this.parentPage)).bind(this));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initButtonListeners();
        this._initRowRecycler();
        this._isInit = true;
        if (this._parentPage) {
            this._updateFromParentPage();
        }
        if (this._flightPlan) {
            this._updateFromFlightPlan();
        }
        this._updateFromActiveArrowShow();
        this._updateFromActiveArrowPosition();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _initAirwayLoadNewButtonManager() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(["Expanded", "Collapsed"]);
        let context = {
            title: "Load New Airways Setting",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this.parentPage.homePageGroup,
            homePageName: this.parentPage.homePageName
        };
        this._airwayLoadNewButtonManager = new WT_TSCSettingValueButtonManager(this.parentPage.instrument, this._airwayLoadNewButton, this.parentPage.settings.newAirwayCollapseSetting, this.parentPage.instrument.selectionListWindow1, context, value => value ? "Collapsed" : "Expanded", [false, true]);
        this._airwayLoadNewButtonManager.init();
    }

    _initSettingListeners() {
        this._parentPage.settings.dataFieldSettings.forEach((setting, index) => setting.addListener(this._onDataFieldSettingChanged.bind(this, index)));
        this._updateDataFieldTitle();
    }

    _updateFromParentPage() {
        this._initAirwayLoadNewButtonManager();
        this._initSettingListeners();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlan} parentPage
     */
    setParentPage(parentPage) {
        if (!parentPage || this.parentPage) {
            return;
        }

        this._parentPage = parentPage;
        if (this._isInit) {
            this._updateFromParentPage();
        }
    }

    _cleanUpFlightPlanRenderer() {
        this._flightPlanRenderer = null;
    }

    _cleanUpFlightPlanListener() {
        this._flightPlan.removeListener(this._flightPlanListener);
    }

    _cleanUpHeader() {
        this._nameTitle.textContent = "______/______";
    }

    _cleanUpRows() {
        this.unselectRow();
        this._rowRecycler.recycleAll();
        this._visibleRows.forEach(row => row.removeButtonListener(this._rowButtonListener));
        this._visibleRows = [];
    }

    _cleanUpFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._cleanUpFlightPlanRenderer();
        this._cleanUpFlightPlanListener();
        this._cleanUpHeader();
        this._cleanUpRows();
    }

    _initFlightPlanRenderer() {
        this._flightPlanRenderer = new WT_G3x5_TSCFlightPlanRenderer(this._flightPlan);
    }

    _initFlightPlanListener() {
        this._flightPlan.addListener(this._flightPlanListener);
    }

    _updateFromFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._initFlightPlanRenderer();
        this._initFlightPlanListener();
        this._drawFlightPlan();
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     */
    setFlightPlan(flightPlan) {
        if (flightPlan === this._flightPlan) {
            return;
        }

        this._cleanUpFlightPlan();
        this._flightPlan = flightPlan;
        if (this._isInit) {
            this._updateFromFlightPlan();
        }
    }

    _initRow(row) {
        row.addButtonListener(this._rowButtonListener);
        this._visibleRows.push(row);
    }

    clearRows() {
        if (this._isInit) {
            this._cleanUpRows();
        }
    }

    requestRow() {
        if (this._isInit) {
            let row = this._rowRecycler.request();
            this._initRow(row);
            return row;
        } else {
            return null;
        }
    }

    /**
     *
     * @returns {WT_G3x5_TSCFlightPlanRowHTMLElement}
     */
    getSelectedRow() {
        return this._selectedRow;
    }

    _cleanUpSelectedRow() {
        let row = this.getSelectedRow();
        if (row) {
            row.onUnselected();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     * @returns {WT_G3x5_TSCFlightPlanHTMLElement.BannerMode}
     */
    _getBannerModeFromRow(row) {
        switch (row.getMode()) {
            case WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER:
                let sequence = row.getActiveModeHTMLElement().sequence;
                if ((sequence === this._flightPlan.getOrigin() && this._flightPlan.hasOrigin()) || sequence === this._flightPlan.getDeparture()) {
                    return WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.ORIGIN;
                } else if ((sequence === this._flightPlan.getDestination() && this._flightPlan.hasDestination()) || sequence === this._flightPlan.getArrival()) {
                    return WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.DESTINATION;
                } else if (sequence instanceof WT_FlightPlanAirwaySequence) {
                    return WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.AIRWAY;
                }
                break;
            case WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG:
            case WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER:
                return WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.WAYPOINT;
        }
        return undefined;
    }

    _updateWaypointBanner() {
        let row = this.getSelectedRow();
        let leg = row.getActiveModeHTMLElement().leg;
        let isEditable = leg.parent === leg.flightPlan.getEnroute();
        let isRemovable = isEditable || leg.segment === WT_FlightPlan.Segment.ORIGIN || leg.segment === WT_FlightPlan.Segment.DESTINATION;

        this._insertBeforeButton.enabled = isEditable;
        this._insertAfterButton.enabled = isEditable;
        this._loadAirwayButton.enabled = leg.segment === WT_FlightPlan.Segment.ENROUTE && leg.fix.airways && leg.fix.airways.length > 0;
        this._waypointRemoveButton.enabled = isRemovable;
    }

    _updateAirwayBanner() {
        let row = this.getSelectedRow();
        let sequence = row.getActiveModeHTMLElement().sequence;
        let isCollapsed = this.getAirwaySequenceCollapse(sequence);

        this._airwayCollapseButton.enabled = !isCollapsed;
        this._airwayExpandButton.enabled = isCollapsed;
    }

    _updateBanner(mode) {
        if (mode === WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.WAYPOINT) {
            this._updateWaypointBanner();
        } else if (mode === WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.AIRWAY) {
            this._updateAirwayBanner();
        }
    }

    _initSelectedRow() {
        let row = this.getSelectedRow();
        let bannerMode;
        if (row) {
            row.onSelected();
            this._rows.scrollManager.scrollToElement(row);
            bannerMode = this._getBannerModeFromRow(row);
        }

        if (bannerMode !== undefined) {
            this.setBannerMode(bannerMode);
            this._updateBanner(bannerMode);
            this.showBanner();
        } else {
            this.hideBanner();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     */
    selectRow(row) {
        if (this.getSelectedRow() === row) {
            return;
        }

        this._cleanUpSelectedRow();
        this._selectedRow = row;
        this._initSelectedRow();
    }

    unselectRow() {
        this.selectRow(null);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     */
    toggleRowSelection(row) {
        if (row === this.getSelectedRow()) {
            this.unselectRow();
        } else {
            this.selectRow(row);
        }
    }

    _updateFromActiveArrowShow() {
        this._wrapper.setAttribute("activearrow-show", `${this._activeArrowShow}`);
    }

    setActiveArrowVisible(value) {
        this._activeArrowShow = value;
        if (this._isInit) {
            this._updateFromActiveArrowShow();
        }
    }

    _updateFromActiveArrowPosition() {
        let top = Math.min(this._activeArrowFrom, this._activeArrowTo);
        let height = Math.abs(this._activeArrowTo - this._activeArrowFrom);

        this._activeArrowStemRect.setAttribute("y", `${top}`);
        this._activeArrowStemRect.setAttribute("height", `${height}`);
        this._activeArrowHead.style.transform = `translateY(${this._activeArrowTo}px) rotateX(0deg)`;
    }

    moveActiveArrow(from, to) {
        this._activeArrowFrom = from;
        this._activeArrowTo = to;
        if (this._isInit) {
            this._updateFromActiveArrowPosition();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement.BannerMode} mode
     */
    setBannerMode(mode) {
        this._wrapper.setAttribute("banner-mode", WT_G3x5_TSCFlightPlanHTMLElement.BANNER_MODE_ATTRIBUTES[mode]);
    }

    showBanner() {
        this._banner.slideIn(WT_TSCSlidingBanner.Direction.RIGHT);
    }

    hideBanner() {
        this._banner.slideOut(WT_TSCSlidingBanner.Direction.RIGHT);
    }

    toggleBanner() {
        if (this._banner.isVisible) {
            this.showBanner();
        } else {
            this.hideBanner();
        }
    }

    /**
     *
     * @param {WT_FlightPlanAirwaySequence} airwaySequence
     * @returns {Boolean}
     */
    getAirwaySequenceCollapse(airwaySequence) {
        let value = this._airwayCollapseMap.get(airwaySequence);
        if (value === undefined) {
            value = this._parentPage.settings.newAirwayCollapseSetting.getValue();
            this._airwayCollapseMap.set(airwaySequence, value);
        }
        return value;
    }

    /**
     *
     * @param {WT_FlightPlanAirwaySequence} airwaySequence
     * @param {Boolean} value
     */
    setAirwaySequenceCollapse(airwaySequence, value) {
        let oldValue = this.getAirwaySequenceCollapse(airwaySequence);
        this._airwayCollapseMap.set(airwaySequence, value);
        if (oldValue !== value) {
            this._needRedrawFlightPlan = true;
        }
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    addButtonListener(listener) {
        this._buttonListeners.push(listener);
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    removeButtonListener(listener) {
        let index = this._buttonListeners.indexOf(listener);
        if (index >= 0) {
            this._buttonListeners.splice(index, 1);
        }
    }

    _drawName() {
        let originWaypoint = this._flightPlan.getOrigin().waypoint;
        let destinationWaypoint = this._flightPlan.getDestination().waypoint;
        this._nameTitle.textContent = `${originWaypoint ? originWaypoint.ident : "______"}/${destinationWaypoint ? destinationWaypoint.ident : "______"}`;
    }

    _drawRows(activeLeg) {
        this._flightPlanRenderer.draw(this, activeLeg);
    }

    _drawFlightPlan(activeLeg) {
        this._drawName();
        this._drawRows(activeLeg);
    }

    _redrawFlightPlan(activeLeg) {
        this._cleanUpRows();
        this._drawFlightPlan(activeLeg);
    }

    _updateAirwayCollapseMap() {
        let toDelete = [];
        this._airwayCollapseMap.forEach((value, key) => {
            if (key.flightPlan !== this._flightPlan) {
                toDelete.push(key);
            }
        }, this);
        toDelete.forEach(key => this._airwayCollapseMap.delete(key));
    }

    _onFlightPlanChanged(event) {
        if (event.types !== WT_FlightPlanEvent.Type.LEG_ALTITUDE_CHANGED) {
            this._updateAirwayCollapseMap();
            this._redrawFlightPlan();
        } else {
            this._flightPlanRenderer.updateAltitudeConstraint(event.changedConstraint.leg);
        }
    }

    _updateDataFieldTitle() {
        let dataFieldSettings = this.parentPage.settings.dataFieldSettings;
        this._dataFieldTitle.textContent = `${WT_G3x5_TSCFlightPlanHTMLElement.DATA_FIELD_MODE_TEXTS[dataFieldSettings.get(0).mode]}/${WT_G3x5_TSCFlightPlanHTMLElement.DATA_FIELD_MODE_TEXTS[dataFieldSettings.get(1).mode]}`;
    }

    _onDataFieldSettingChanged(index, setting, newValue, oldValue) {
        this._updateDataFieldTitle();
    }

    _notifyButtonListeners(event) {
        this._buttonListeners.forEach(listener => listener(event));
    }

    _onRowButtonPressed(event) {
        this._notifyButtonListeners(event);
    }

    _onWaypointBannerButtonPressed(eventType, button) {
        let row = this.getSelectedRow();
        let modeHTMLElement = row.getActiveModeHTMLElement();
        let leg = modeHTMLElement.leg ? modeHTMLElement.leg : null;

        if (leg) {
            this._notifyButtonListeners({
                button: button,
                type: eventType,
                row: row,
                leg: leg
            });
        }
    }

    _onAirwayBannerButtonPressed(eventType, button) {
        let row = this.getSelectedRow();
        let sequence = row.getMode() === WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER ? row.getActiveModeHTMLElement().sequence : null;

        if (sequence) {
            this._notifyButtonListeners({
                button: button,
                type: eventType,
                row: row,
                sequence: sequence
            });
        }
    }

    open() {
    }

    close() {
        this.unselectRow();
        if (this._isInit) {
            this._banner.popOut();
            this._rows.scrollManager.cancelScroll();
        }
    }

    _scrollSelectedRow(direction) {
        let index = this._visibleRows.indexOf(this.getSelectedRow());
        if (index < 0) {
            return;
        }

        index += direction;
        let row = this._visibleRows[index];
        while (row) {
            let mode = row.getMode();
            if (mode === WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG || mode === WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER) {
                this.selectRow(row);
                return;
            }
            index += direction;
            row = this._visibleRows[index];
        }
    }

    scrollUp() {
        if (!this._isInit) {
            return;
        }

        if (this.getSelectedRow()) {
            this._scrollSelectedRow(-1);
        } else {
            this._rows.scrollManager.scrollUp();
        }
    }

    scrollDown() {
        if (!this._isInit) {
            return;
        }

        if (this.getSelectedRow()) {
            this._scrollSelectedRow(1);
        } else {
            this._rows.scrollManager.scrollDown();
        }
    }

    _updateFlightPlan(state) {
        if (this._needRedrawFlightPlan) {
            this._redrawFlightPlan(state.activeLeg);
            this._needRedrawFlightPlan = false;
        }
        this._flightPlanRenderer.update(this, state);
    }

    _updateScroll() {
        this._rows.scrollManager.update();
    }

    _doUpdate(state) {
        this._updateFlightPlan(state);
        this._updateScroll();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(state) {
        if (!this._isInit || !this._flightPlan) {
            return;
        }

        this._doUpdate(state);
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlanHTMLElement.BannerMode = {
    ORIGIN: 0,
    DESTINATION: 1,
    WAYPOINT: 2,
    AIRWAY: 3
};
WT_G3x5_TSCFlightPlanHTMLElement.BANNER_MODE_ATTRIBUTES = [
    "origin",
    "destination",
    "waypoint",
    "airway"
];
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType = {
    DRCT: 0,
    PROC: 1,
    STANDBY_FLIGHT_PLAN: 2,
    VNAV: 3,
    FLIGHT_PLAN_OPTIONS: 4,
    HEADER: 5,
    LEG_WAYPOINT: 6,
    LEG_ALTITUDE: 7,
    ENROUTE_ADD: 8,
    ENROUTE_DONE: 9,
    ORIGIN_SELECT: 10,
    DEPARTURE_SELECT: 11,
    ORIGIN_REMOVE: 12,
    ORIGIN_INFO: 13,
    DESTINATION_SELECT: 14,
    ARRIVAL_SELECT: 15,
    APPROACH_SELECT: 16,
    DESTINATION_REMOVE: 17,
    DESTINATION_INFO: 18,
    INSERT_BEFORE: 19,
    INSERT_AFTER: 20,
    WAYPOINT_DRCT: 21,
    ACTIVATE_LEG: 22,
    LOAD_AIRWAY: 23,
    WAYPOINT_REMOVE: 24,
    WAYPOINT_INFO: 25,
    AIRWAY_COLLAPSE: 26,
    AIRWAY_EXPAND: 27,
    AIRWAY_COLLAPSE_ALL: 28,
    AIRWAY_EXPAND_ALL: 29,
    AIRWAY_REMOVE: 30,
    AIRWAY_EDIT: 31
};
WT_G3x5_TSCFlightPlanHTMLElement.DATA_FIELD_MODE_TEXTS = [
    "CUM",
    "DIS",
    "DTK",
    "ETA",
    "ETE",
    "FUEL"
];
WT_G3x5_TSCFlightPlanHTMLElement.NAME = "wt-tsc-flightplan";
WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            width: 100%;
            height: 100%;
        }
            #grid {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: var(--flightplan-left-width, 4em) 1fr;
                grid-gap: 0 var(--flightplan-left-margin-right, 0.2em);
            }
                #left {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: grid;
                    grid-template-rows: repeat(5, 1fr);
                    grid-template-columns: 100%;
                    grid-gap: var(--flightplan-left-button-margin-vertical, 0.2em) 0;
                }
                    #drct {
                        --button-img-image-height: 90%;
                    }
                    #stdbyfpln,
                    #fplnoptions {
                        font-size: 0.85em;
                    }
                #tablecontainer {
                    position: relative;
                    border-radius: 3px;
                    background: linear-gradient(#1f3445, black 25px);
                    border: 3px solid var(--wt-g3x5-bordergray);
                }
                    #table {
                        position: absolute;
                        left: var(--flightplan-table-padding-left, 0.1em);
                        top: var(--flightplan-table-padding-top, 0.1em);
                        width: calc(100% - var(--flightplan-table-padding-left, 0.1em) - var(--flightplan-table-padding-right, 0.1em));
                        height: calc(100% - var(--flightplan-table-padding-top, 0.1em) - var(--flightplan-table-padding-bottom, 0.1em));
                        display: grid;
                        grid-template-columns: 100%;
                        grid-template-rows: var(--flightplan-table-head-height, 1em) 1fr;
                        grid-gap: var(--flightplan-table-head-margin-bottom, 0.1em) 0;
                    }
                        #header {
                            position: relative;
                            width: calc(100% - var(--scrolllist-scrollbar-width, 1vw) - var(--flightplan-table-row-margin-right, 0.2em));
                            height: 100%;
                            display: grid;
                            grid-template-rows: 100%;
                            grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
                            grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
                            align-items: center;
                            justify-items: center;
                            font-size: var(--flightplan-table-header-font-size, 0.85em);
                            color: white;
                        }
                            #nametitle {
                                justify-self: start;
                                margin: 0 0.2em;
                            }
                        #rows {
                            position: relative;
                            width: 100%;
                            height: 100%;
                            --scrolllist-padding-left: 0%;
                            --scrolllist-padding-right: var(--flightplan-table-row-margin-right, 0.2em);
                            --scrolllist-padding-top: 0%;
                        }
                            #scrollcontainer {
                                position: relative;
                                width: 100%;
                            }
                            #rowscontainer {
                                position: relative;
                                width: 100%;
                                display: flex;
                                flex-flow: column nowrap;
                                align-items: stretch;
                            }
                                wt-tsc-flightplan-row {
                                    height: var(--flightplan-table-row-height, 3em);
                                    margin-bottom: var(--flightplan-table-row-margin-vertical, 0.1em);
                                }
                            .activeArrow {
                                display: none;
                            }
                            #wrapper[activearrow-show="true"] .activeArrow {
                                display: block;
                            }
                            #activearrowstem {
                                position: absolute;
                                left: var(--flightplan-table-arrow-left, 0.2em);
                                top: 0%;
                                width: calc(100% - var(--flightplan-table-arrow-right, calc(100% - 1.5em)) - var(--flightplan-table-arrow-left, 0.2em) - var(--flightplan-table-arrow-head-size, 0.75em) / 2);
                                height: 100%;
                                transform: rotateX(0deg);
                            }
                                #activearrowstem rect {
                                    stroke-width: var(--flightplan-table-arrow-stroke-width, 0.2em);
                                    stroke: var(--wt-g3x5-purple);
                                    fill: transparent;
                                    transform: translate(calc(var(--flightplan-table-arrow-stroke-width, 0.2em) / 2), 0);
                                }
                            #activearrowhead {
                                position: absolute;
                                right: var(--flightplan-table-arrow-right, calc(100% - 1.5em));
                                top: calc(-1 * var(--flightplan-table-arrow-head-size, 0.75em) / 2);
                                width: var(--flightplan-table-arrow-head-size, 0.75em);
                                height: var(--flightplan-table-arrow-head-size, 0.75em);
                                transform: rotateX(0deg);
                            }
                                #activearrowhead polygon {
                                    fill: var(--wt-g3x5-purple);
                                }
            #banner {
                position: absolute;
                right: -1vw;
                top: 50%;
                width: calc(var(--flightplan-banner-width, 40%) + 1vw + var(--flightplan-banner-margin-right, 0px));
                height: var(--flightplan-banner-height, 100%);
                transform: translateY(-50%);
                --slidingbanner-padding-right: calc(1vw + var(--flightplan-banner-margin-right, 0px));
            }
                #bannerpadding {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 5px;
                    border: 3px solid var(--wt-g3x5-bordergray);
                    background: black;
                }
                    .bannerContent {
                        display: none;
                        position: absolute;
                        left: var(--flightplan-banner-padding-left, 0.1em);
                        top: var(--flightplan-banner-padding-top, 0.1em);
                        width: calc(100% - var(--flightplan-banner-padding-left, 0.1em) - var(--flightplan-banner-padding-right, 0.1em));
                        height: calc(100% - var(--flightplan-banner-padding-top, 0.1em) - var(--flightplan-banner-padding-bottom, 0.1em));
                        font-size: var(--flightplan-banner-font-size, 0.85em);
                        grid-template-rows: repeat(5, 1fr);
                        grid-template-columns: 1fr 1fr;
                        grid-gap: var(--flightplan-banner-grid-gap, 0.1em);
                    }
                    #wrapper[banner-mode="origin"] #originbanner {
                        display: grid;
                    }
                    #wrapper[banner-mode="destination"] #destinationbanner {
                        display: grid;
                    }
                    #wrapper[banner-mode="waypoint"] #waypointbanner {
                        display: grid;
                    }
                    #wrapper[banner-mode="airway"] #airwaybanner {
                        display: grid;
                    }
                        .bannerPosition11 {
                            grid-area: 1 / 1;
                        }
                        .bannerPosition12 {
                            grid-area: 1 / 2;
                        }
                        .bannerPosition21 {
                            grid-area: 2 / 1;
                        }
                        .bannerPosition22 {
                            grid-area: 2 / 2;
                        }
                        .bannerPosition31 {
                            grid-area: 3 / 1;
                        }
                        .bannerPosition32 {
                            grid-area: 3 / 2;
                        }
                        .bannerPosition41 {
                            grid-area: 4 / 1;
                        }
                        .bannerPosition42 {
                            grid-area: 4 / 2;
                        }
                        .bannerPosition51 {
                            grid-area: 5 / 1;
                        }
                        .bannerPosition52 {
                            grid-area: 5 / 2;
                        }
                        #waypointdrct {
                            --button-img-image-height: 90%;
                        }
                        #loadnewairways {
                            grid-area: 3 / 1 / 4 / 3;
                        }
    </style>
    <div id="wrapper">
        <div id="grid">
            <div id="left">
                <wt-tsc-button-img id="drct" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_DIRECT_TO_1.png"></wt-tsc-button-img>
                <wt-tsc-button-label id="proc" labeltext="PROC"></wt-tsc-button-label>
                <wt-tsc-button-label id="stdbyfpln" labeltext="Standby Flight Plan" enabled="false"></wt-tsc-button-label>
                <wt-tsc-button-label id="vnav" labeltext="VNAV" enabled="false"></wt-tsc-button-label>
                <wt-tsc-button-label id="fplnoptions" labeltext="Flight Plan Options"></wt-tsc-button-label>
            </div>
            <div id="tablecontainer">
                <div id="table">
                    <div id="header">
                        <div id="nametitle">______/______</div>
                        <div id="alttitle">ALT</div>
                        <div id="datafieldtitle"></div>
                    </div>
                    <wt-tsc-scrolllist id="rows">
                        <div id="scrollcontainer" slot="content">
                            <div id="rowscontainer"></div>
                            <svg id="activearrowstem" class="activeArrow">
                                <rect x="0" y="0" rx="10" ry="10" width="1000" height="0" />
                            </svg>
                            <svg id="activearrowhead" class="activeArrow" viewBox="0 0 86.6 100">
                                <polygon points="0,0 86.6,50 0,100" />
                            </svg>
                        </div>
                    </wt-tsc-scrolllist>
                </div>
            </div>
        </div>
        <wt-tsc-slidingbanner id="banner">
            <div id="bannerpadding" slot="content">
                <div id="originbanner" class="bannerContent">
                    <wt-tsc-button-label id="originselect" class="bannerPosition11" labeltext="Select Origin Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="departurerwyselect" class="bannerPosition21" labeltext="Select Departure Runway" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="departureselect" class="bannerPosition31" labeltext="Select Departure"></wt-tsc-button-label>
                    <wt-tsc-button-label id="originremove" class="bannerPosition51" labeltext="Remove Origin Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="origininfo" class="bannerPosition12" labeltext="Waypoint Info"></wt-tsc-button-label>
                    <wt-tsc-button-label id="takeoffdata" class="bannerPosition22" labeltext="Takeoff Data" enabled="false"></wt-tsc-button-label>
                </div>
                <div id="destinationbanner" class="bannerContent">
                    <wt-tsc-button-label id="destinationselect" class="bannerPosition11" labeltext="Select Destination Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="arrivalrwyselect" class="bannerPosition21" labeltext="Select Arrival Runway" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="arrivalselect" class="bannerPosition31" labeltext="Select Arrival"></wt-tsc-button-label>
                    <wt-tsc-button-label id="approachselect" class="bannerPosition41" labeltext="Select Approach"></wt-tsc-button-label>
                    <wt-tsc-button-label id="destinationremove" class="bannerPosition51" labeltext="Remove Destination Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="destinationinfo" class="bannerPosition12" labeltext="Waypoint Info"></wt-tsc-button-label>
                    <wt-tsc-button-label id="landingdata" class="bannerPosition22" labeltext="Landing Data" enabled="false"></wt-tsc-button-label>
                </div>
                <div id="waypointbanner" class="bannerContent">
                    <wt-tsc-button-label id="insertbefore" class="bannerPosition11" labeltext="Insert<br>Before"></wt-tsc-button-label>
                    <wt-tsc-button-label id="insertafter" class="bannerPosition12" labeltext="Insert<br>After"></wt-tsc-button-label>
                    <wt-tsc-button-img id="waypointdrct" class="bannerPosition21" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_DIRECT_TO_1.png"></wt-tsc-button-img>
                    <wt-tsc-button-label id="activateleg" class="bannerPosition22" labeltext="Activate Leg to Waypoint"></wt-tsc-button-label>
                    <wt-tsc-button-label id="loadairway" class="bannerPosition31" labeltext="Load Airway"></wt-tsc-button-label>
                    <wt-tsc-button-label id="alongtrack" class="bannerPosition32" labeltext="Along Track Waypoint" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="hold" class="bannerPosition41" labeltext="Hold at Waypoint" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="waypointinfo" class="bannerPosition42" labeltext="Waypoint Info"></wt-tsc-button-label>
                    <wt-tsc-button-label id="waypointremove" class="bannerPosition51" labeltext="Remove Waypoint"></wt-tsc-button-label>
                    <wt-tsc-button-statusbar id="flyover" class="bannerPosition52" labeltext="Fly Over Waypoint" enabled="false"></wt-tsc-button-statusbar>
                </div>
                <div id="airwaybanner" class="bannerContent">
                    <wt-tsc-button-label id="airwaycollapse" class="bannerPosition11" labeltext="Collapse<br>Airway"></wt-tsc-button-label>
                    <wt-tsc-button-label id="airwayexpand" class="bannerPosition12" labeltext="Expand<br>Airway"></wt-tsc-button-label>
                    <wt-tsc-button-label id="collapseall" class="bannerPosition21" labeltext="Collapse<br>All"></wt-tsc-button-label>
                    <wt-tsc-button-label id="expandall" class="bannerPosition22" labeltext="Expand<br>All"></wt-tsc-button-label>
                    <wt-tsc-button-value id="loadnewairways" labeltext="Load New Airways"></wt-tsc-button-value>
                    <wt-tsc-button-label id="airwayremove" class="bannerPosition51" labeltext="Remove Airway"></wt-tsc-button-label>
                    <wt-tsc-button-statusbar id="airwayedit" class="bannerPosition52" labeltext="Edit Airway" enabled="false"></wt-tsc-button-statusbar>
                </div>
            </div>
        </wt-tsc-slidingbanner>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanHTMLElement.NAME, WT_G3x5_TSCFlightPlanHTMLElement);

/**
 * @typedef WT_G3x5_TSCFlightPlanButtonEvent
 * @property {WT_TSCButton} button
 * @property {WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType} type
 * @property {WT_G3x5_TSCFlightPlanRowHTMLElement} [row]
 * @property {WT_FlightPlanSequence} [sequence]
 * @property {WT_FlightPlanLeg} [leg]
 */

class WT_G3x5_TSCFlightPlanRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {((event:WT_G3x5_TSCFlightPlanButtonEvent) => void)[]}
         */
        this._buttonListeners = [];

        this._mode = WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.NONE;
        this._isInit = false;

        this._initChildren();
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE;
    }

    _initLeg() {
        this._leg = new WT_G3x5_TSCFlightPlanRowLegHTMLElement();
        this._leg.id = WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG];
        this._leg.classList.add("mode");
        this._modeHTMLElements.push(this._leg);
    }

    _initHeader() {
        this._header = new WT_G3x5_TSCFlightPlanRowHeaderHTMLElement();
        this._header.id = WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER];
        this._header.classList.add("mode");
        this._modeHTMLElements.push(this._header);
    }

    _initEnrouteFooter() {
        this._enrouteFooter = new WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement();
        this._enrouteFooter.id = WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER];
        this._enrouteFooter.classList.add("mode");
        this._modeHTMLElements.push(this._enrouteFooter);
    }

    _initAirwayFooter() {
        this._airwayFooter = new WT_G3x5_TSCFlightPlanRowAirwaySequenceFooterHTMLElement();
        this._airwayFooter.id = WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER];
        this._airwayFooter.classList.add("mode");
        this._modeHTMLElements.push(this._airwayFooter);
    }

    _initChildren() {
        this._modeHTMLElements = [null];
        this._initLeg();
        this._initHeader();
        this._initEnrouteFooter();
        this._initAirwayFooter();
    }

    _appendChildren() {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                this.shadowRoot.appendChild(element);
            }
        });
    }

    _initLegButtonListeners() {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);
        mode.addWaypointButtonListener(this._onLegWaypointButtonPressed.bind(this));
        mode.addAltitudeButtonListener(this._onLegAltitudeButtonPressed.bind(this));
    }

    _initHeaderButtonListeners() {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER);
        mode.addButtonListener(this._onHeaderButtonPressed.bind(this));
    }

    _initEnrouteFooterButtonListeners() {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER);
        mode.addAddButtonListener(this._onEnrouteAddButtonPressed.bind(this));
        mode.addDoneButtonListener(this._onEnrouteDoneButtonPressed.bind(this));
    }

    _initAirwayFooterButtonListeners() {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER);
        mode.addWaypointButtonListener(this._onAirwayFooterWaypointButtonPressed.bind(this));
        mode.addAltitudeButtonListener(this._onAirwayFooterAltitudeButtonPressed.bind(this));
    }

    async _initButtonListeners() {
        await Promise.all(this._modeHTMLElements.filter(element => element !== null).map(element => WT_Wait.awaitCallback(() => element.isInitialized)));
        this._initLegButtonListeners();
        this._initHeaderButtonListeners();
        this._initEnrouteFooterButtonListeners();
        this._initAirwayFooterButtonListeners();
    }

    async _connectedCallbackHelper() {
        this._appendChildren();
        await this._initButtonListeners();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _initFromParentPage() {
        this._leg.setInstrument(this._parentPage.instrument);
        this._airwayFooter.setInstrument(this._parentPage.instrument);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlan} parentPage
     */
    setParentPage(parentPage) {
        if (!parentPage || this._parentPage) {
            return;
        }

        this._parentPage = parentPage;
        this._initFromParentPage();
    }

    /**
     *
     * @returns {WT_G3x5_TSCFlightPlanRowHTMLElement.Mode}
     */
    getMode() {
        return this._mode;
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement.Mode} mode
     */
    setMode(mode) {
        if (this._mode !== mode) {
            this.setAttribute("mode", WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[mode]);
            this._mode = mode;
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement.Mode} mode
     * @return {HTMLElement}
     */
    getModeHTMLElement(mode) {
        return this._modeHTMLElements[mode];
    }

    /**
     *
     * @return {HTMLElement}
     */
    getActiveModeHTMLElement() {
        return this._modeHTMLElements[this._mode];
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    addButtonListener(listener) {
        this._buttonListeners.push(listener);
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    removeButtonListener(listener) {
        let index = this._buttonListeners.indexOf(listener);
        if (index >= 0) {
            this._buttonListeners.splice(index, 1);
        }
    }

    _notifyButtonListeners(event) {
        this._buttonListeners.forEach(listener => listener(event));
    }

    _onLegWaypointButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_WAYPOINT,
            row: this,
            leg: mode.leg
        }
        this._notifyButtonListeners(event);
    }

    _onLegAltitudeButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_ALTITUDE,
            row: this,
            leg: mode.leg
        }
        this._notifyButtonListeners(event);
    }

    _onHeaderButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.HEADER,
            row: this,
            sequence: mode.sequence
        }
        this._notifyButtonListeners(event);
    }

    _onEnrouteAddButtonPressed(button) {
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ENROUTE_ADD,
            row: this
        }
        this._notifyButtonListeners(event);
    }

    _onEnrouteDoneButtonPressed(button) {
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ENROUTE_DONE,
            row: this
        }
        this._notifyButtonListeners(event);
    }

    _onAirwayFooterWaypointButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_WAYPOINT,
            row: this,
            leg: mode.leg
        }
        this._notifyButtonListeners(event);
    }

    _onAirwayFooterAltitudeButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_ALTITUDE,
            row: this,
            leg: mode.leg
        }
        this._notifyButtonListeners(event);
    }

    onUnselected() {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                element.onUnselected();
            }
        });
    }

    onSelected() {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                element.onSelected();
            }
        });
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlanRowHTMLElement.Mode = {
    NONE: 0,
    LEG: 1,
    HEADER: 2,
    ENROUTE_FOOTER: 3,
    AIRWAY_FOOTER: 4
}
WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS = [
    "",
    "leg",
    "header",
    "enroutefooter",
    "airwayfooter"
];
WT_G3x5_TSCFlightPlanRowHTMLElement.NAME = "wt-tsc-flightplan-row";
WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
        }

        .mode {
            display: none;
        }

        :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG]}]) #leg {
            display: block;
        }
        :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER]}]) #header {
            display: block;
        }
        :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER]}]) #enroutefooter {
            display: block;
        }
        :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER]}]) #airwayfooter {
            display: block;
        }
    </style>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowHTMLElement);

class WT_G3x5_TSCFlightPlanWaypointButton extends WT_G3x5_TSCWaypointButton {
    constructor() {
        super();
    }

    _createIdentStyle() {
        return `
            #ident {
                position: absolute;
                left: 2%;
                top: 5%;
                font-size: var(--waypoint-ident-font-size, 1.67em);
                text-align: left;
                color: var(--waypoint-ident-color, var(--wt-g3x5-lightblue));
            }
            :host([active=true]) #ident {
                color: var(--wt-g3x5-purple);
            }
            :host([highlight=true][primed=false][active=false]) #ident {
                color: black;
            }
        `;
    }

    _createNameStyle() {
        return `
            #name {
                position: absolute;
                left: 2%;
                width: 90%;
                bottom: 5%;
                font-size: var(--waypoint-name-font-size, 1em);
                text-align: left;
                white-space: nowrap;
                overflow: hidden;
                color: var(--waypoint-name-color, white);
            }
            :host([active=true]) #name {
                color: var(--wt-g3x5-purple);
            }
            :host([highlight=true][primed=false][active=false]) #name {
                color: black;
            }
        `;
    }

    get active() {
        return this.getAttribute("active");
    }

    set active(value) {
        this.setAttribute("active", value);
    }
}
WT_G3x5_TSCFlightPlanWaypointButton.NAME = "wt-tsc-button-fpwaypoint";

customElements.define(WT_G3x5_TSCFlightPlanWaypointButton.NAME, WT_G3x5_TSCFlightPlanWaypointButton);

class WT_G3x5_TSCFlightPlanRowLegHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {AS3000_TSC}
         */
        this._instrument = null;
        /**
         * @type {WT_FlightPlanLeg}
         */
        this._leg = null;
        this._bearingUnit = null;
        this._distanceUnit = null;
        this._altitudeUnit = null;
        this._dataFieldModes = WT_G3x5_TSCFlightPlanSettings.DATA_FIELD_DEFAULT_VALUES.slice();
        this._dataFieldIsDynamic = this._dataFieldModes.map(this._isDataFieldModeDynamic.bind(this));
        this._dataFieldLastUpdateTimes = this._dataFieldModes.map(() => 0);

        this._isActive = false;
        this._isInit = false;

        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempKnots = WT_Unit.KNOT.createNumber(0);
        this._tempGPH = WT_Unit.GPH.createNumber(0);
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowLegHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    /**
     * @readonly
     * @type {WT_FlightPlanLeg}
     */
    get leg() {
        return this._leg;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        [
            this._waypointButton,
            this._altitudeConstraintButton,
            this._altitudeConstraint,
            this._dataFieldViews
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#waypoint`, WT_G3x5_TSCFlightPlanWaypointButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#altconstraintbutton`, WT_TSCContentButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#altconstraint`, WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement),
            Promise.all([
                WT_CustomElementSelector.select(this.shadowRoot, `#datafield1`, WT_G3x5_NavDataInfoView),
                WT_CustomElementSelector.select(this.shadowRoot, `#datafield2`, WT_G3x5_NavDataInfoView)
            ])
        ]);
    }

    _initChildren() {
        this._waypointButton.setIconSrcFactory(new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCFlightPlanRowLegHTMLElement.WAYPOINT_ICON_IMAGE_DIRECTORY));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initChildren();
        this._isInit = true;
        this._updateFromLeg();
        this._updateFromActive();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateCumulativeDistance(value) {
        value.set(this.leg ? this.leg.cumulativeDistance : NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateLegDistance(value) {
        value.set(this.leg ? this.leg.distance : NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateDTK(value) {
        if (this.leg) {
            value.unit.setLocation(this.leg.desiredTrack.unit.location);
            value.set(this.leg.desiredTrack);
        } else {
            value.set(NaN);
        }
    }

    /**
     *
     * @param {WT_Time} time
     */
    _updateETA(time) {
        if (this.leg) {
            let fpm = this._instrument.flightPlanManagerWT;
            let activeLeg = fpm.getActiveLeg(true);
            if (activeLeg && activeLeg.flightPlan === this.leg.flightPlan && activeLeg.index <= this.leg.index) {
                let distanceNM = this.leg.cumulativeDistance.asUnit(WT_Unit.NMILE) - activeLeg.cumulativeDistance.asUnit(WT_Unit.NMILE) + fpm.distanceToActiveLegFix(true, this._tempNM).number;
                let speedKnots = this._instrument.airplane.navigation.groundSpeed(this._tempKnots).number;
                if (speedKnots > 0) {
                    let ete = distanceNM / speedKnots;
                    time.set(this._instrument.time);
                    time.add(ete, WT_Unit.HOUR);
                    return;
                }
            }
        }
        time.set(NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateETE(value) {
        if (this.leg) {
            let distanceNM = this.leg.distance.asUnit(WT_Unit.NMILE);
            let speedKnots = this._instrument.airplane.navigation.groundSpeed(this._tempKnots).number;
            value.set(speedKnots > 0 ? (distanceNM / speedKnots) : NaN, WT_Unit.HOUR);
        } else {
            value.set(NaN);
        }
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateFuelToDestination(value) {
        if (this.leg) {
            let distanceToDestinationNM = this.leg.flightPlan.legs.last().cumulativeDistance.asUnit(WT_Unit.NMILE) - this.leg.cumulativeDistance.asUnit(WT_Unit.NMILE);
            let speedKnots = this._instrument.airplane.navigation.groundSpeed(this._tempKnots).number;
            let fuelFlowGPH = this._instrument.airplane.engineering.fuelFlowTotal(this._tempGPH).number;
            value.set((speedKnots > 0 && fuelFlowGPH > 0) ? (distanceToDestinationNM / speedKnots * fuelFlowGPH) : NaN, WT_Unit.GALLON);
        } else {
            value.set(NaN);
        }
    }

    _initNavDataInfos() {
        this._navDataInfos = [
            new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "CUM"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.NMILE, {updateValue: this._updateCumulativeDistance.bind(this)})),
            new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "DIS"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.NMILE, {updateValue: this._updateLegDistance.bind(this)})),
            new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "DTK"}, new WT_NumberUnitModelAutoUpdated(new WT_NavAngleUnit(true), {updateValue: this._updateDTK.bind(this)})),
            new WT_G3x5_NavDataInfoTime({shortName: "", longName: "ETA"}, new WT_G3x5_TimeModel(new WT_TimeModelAutoUpdated("", {updateTime: this._updateETA.bind(this)}), this._instrument.avionicsSystemSettingModel.timeFormatSetting, this._instrument.avionicsSystemSettingModel.timeLocalOffsetSetting)),
            new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "ETE"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.SECOND, {updateValue: this._updateETE.bind(this)})),
            new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "FUEL"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.GALLON, {updateValue: this._updateFuelToDestination.bind(this)}))
        ];
    }

    _initNavDataFormatters() {
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

        let durationOpts = {
            timeFormat: WT_TimeFormatter.Format.HH_MM_OR_MM_SS,
            delim: WT_TimeFormatter.Delim.COLON_OR_CROSS
        }
        let durationFormatter = new WT_TimeFormatter(durationOpts);

        this._navDataFormatters = [
            new WT_G3x5_NavDataInfoViewNumberFormatter(distanceFormatter),
            new WT_G3x5_NavDataInfoViewNumberFormatter(distanceFormatter),
            new WT_G3x5_NavDataInfoViewDegreeFormatter(bearingFormatter),
            new WT_G3x5_NavDataInfoViewTimeFormatter(),
            new WT_G3x5_NavDataInfoViewDurationFormatter(durationFormatter, "__:__"),
            new WT_G3x5_NavDataInfoViewNumberFormatter(volumeFormatter)
        ];
    }

    _initFromInstrument() {
        this._initNavDataInfos();
        this._initNavDataFormatters();
    }

    /**
     *
     * @param {AS3000_TSC} instrument
     */
    setInstrument(instrument) {
        if (!instrument || this._instrument) {
            return;
        }

        this._instrument = instrument;
        this._initFromInstrument();
    }

    _clearWaypointButton() {
        this._waypointButton.setWaypoint(null);
    }

    _clearAltitudeConstraint() {
        this._altitudeConstraint.update(null, this._altitudeUnit);
    }

    _clearAirway() {
        this._wrapper.setAttribute("airway", "false");
    }

    _updateWaypointFromLeg() {
        this._waypointButton.setWaypoint(this._leg.fix);
    }

    _updateAltitudeConstraintFromLeg() {
        this._altitudeConstraint.update(this._leg.altitudeConstraint, this._altitudeUnit);
    }

    /**
     *
     * @param {Number} index
     */
    _updateDataFieldFromLeg(index) {
        let view = this._dataFieldViews[index];
        let mode = this._dataFieldModes[index];
        view.update(this._navDataInfos[mode], this._navDataFormatters[mode]);
        this._dataFieldLastUpdateTimes[index] = this._instrument.currentTimeStamp;
    }

    _updateDataFieldsFromLeg() {
        for (let i = 0; i < this._dataFieldViews.length; i++) {
            this._updateDataFieldFromLeg(i);
        }
    }

    _updateAirwayFromLeg() {
        this._wrapper.setAttribute("airway", `${this._leg.parent instanceof WT_FlightPlanAirwaySequence}`);
    }

    _updateFromLeg() {
        if (this._leg) {
            this._updateWaypointFromLeg();
            this._updateAltitudeConstraintFromLeg();
            this._updateAirwayFromLeg();
        } else {
            this._clearWaypointButton();
            this._clearAltitudeConstraint();
            this._clearAirway();
        }
        this._updateDataFieldsFromLeg();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    setLeg(leg) {
        this._leg = leg;
        if (this._isInit) {
            this._updateFromLeg();
        }
    }

    _updateFromActive() {
        this._wrapper.setAttribute("active", `${this._isActive}`);
        this._waypointButton.active = `${this._isActive}`;
    }

    setActive(value) {
        if (value === this._isActive) {
            return;
        }

        this._isActive = value;
        if (this._isInit) {
            this._updateFromActive();
        }
    }

    addWaypointButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._waypointButton.addButtonListener(listener);
    }

    removeWaypointButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._waypointButton.removeButtonListener(listener);
    }

    addAltitudeButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._altitudeConstraintButton.addButtonListener(listener);
    }

    removeAltitudeButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._altitudeConstraintButton.removeButtonListener(listener);
    }

    onUnselected() {
        this._waypointButton.highlight = "false";
    }

    onSelected() {
        this._waypointButton.highlight = "true";
    }

    updateAltitudeConstraint() {
        this._updateAltitudeConstraintFromLeg();
    }

    /**
     *
     * @param {Number} airplaneHeadingTrue
     */
    _updateWaypointButton(airplaneHeadingTrue) {
        this._waypointButton.update(airplaneHeadingTrue);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanUnitsModel} unitsModel
     * @returns {Boolean}
     */
    _updateDataFieldUnits(unitsModel) {
        let updated = false;
        if (!unitsModel.bearingUnit.equals(this._bearingUnit)) {
            this._bearingUnit = unitsModel.bearingUnit;
            this._navDataInfos[WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.DTK].setDisplayUnit(this._bearingUnit);
            updated = true;
        }
        if (!unitsModel.distanceUnit.equals(this._distanceUnit)) {
            this._distanceUnit = unitsModel.distanceUnit;
            this._navDataInfos[WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.CUM].setDisplayUnit(this._distanceUnit);
            this._navDataInfos[WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.DIS].setDisplayUnit(this._distanceUnit);
            updated = true;
        }
        return updated;
    }

    _isDataFieldModeDynamic(mode) {
        switch (mode) {
            case WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.ETA:
            case WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.ETE:
            case WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.FUEL:
                return true;
            default:
                return false;
        }
    }

    /**
     *
     * @param {WT_ReadOnlyArray<WT_G3x5_TSCFlightPlanDataFieldSetting>} dataFieldSettings
     * @returns {Boolean}
     */
    _updateDataFieldModes(dataFieldSettings) {
        let updated = false;
        for (let i = 0; i < this._dataFieldModes.length; i++) {
            let mode = dataFieldSettings.get(i).mode;
            if (this._dataFieldModes[i] !== mode) {
                this._dataFieldModes[i] = mode;
                this._dataFieldIsDynamic[i] = this._isDataFieldModeDynamic(mode);
                updated = true;
            }
        }
        return updated;
    }

    _updateDynamicDataFields() {
        this._dataFieldModes.forEach((value, index) => {
            if (this._dataFieldIsDynamic[index] && this._instrument.currentTimeStamp - this._dataFieldLastUpdateTimes[index] > WT_G3x5_TSCFlightPlanRowLegHTMLElement.DYNAMIC_DATA_FIELD_UPDATE_INTERVAL) {
                this._updateDataFieldFromLeg(index);
            }
        });
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanUnitsModel} unitsModel
     * @param {WT_ReadOnlyArray<WT_G3x5_TSCFlightPlanDataFieldSetting>} dataFieldSettings
     */
    _updateDataFields(unitsModel, dataFieldSettings) {
        let unitsUpdated = this._updateDataFieldUnits(unitsModel);
        let dataFieldModeUpdated = this._updateDataFieldModes(dataFieldSettings);
        if (unitsUpdated || dataFieldModeUpdated) {
            this._updateDataFieldsFromLeg();
        } else {
            this._updateDynamicDataFields();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanUnitsModel} unitsModel
     */
    _updateAltitudeConstraint(unitsModel) {
        if (!unitsModel.altitudeUnit.equals(this._altitudeUnit)) {
            this._altitudeUnit = unitsModel.altitudeUnit;
            this._updateAltitudeConstraintFromLeg();
        }
    }

    /**
     *
     * @param {Number} airplaneHeadingTrue
     * @param {WT_G3x5_TSCFlightPlanUnitsModel} unitsModel
     * @param {WT_ReadOnlyArray<WT_G3x5_TSCFlightPlanDataFieldSetting>} dataFieldSettings
     */
    update(airplaneHeadingTrue, unitsModel, dataFieldSettings) {
        if (!this._isInit || !this._leg) {
            return;
        }

        this._updateWaypointButton(airplaneHeadingTrue);
        this._updateDataFields(unitsModel, dataFieldSettings);
        this._updateAltitudeConstraint(unitsModel);
    }
}
WT_G3x5_TSCFlightPlanRowLegHTMLElement.DYNAMIC_DATA_FIELD_UPDATE_INTERVAL = 2000; // milliseconds
WT_G3x5_TSCFlightPlanRowLegHTMLElement.WAYPOINT_ICON_IMAGE_DIRECTORY = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
WT_G3x5_TSCFlightPlanRowLegHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_TSCFlightPlanRowLegHTMLElement.NAME = "wt-tsc-flightplan-row-leg";
WT_G3x5_TSCFlightPlanRowLegHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowLegHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            #airwaylink {
                display: none;
                position: absolute;
                left: var(--flightplan-table-row-airwaylink-left, 0.25em);
                top: -50%;
                width: calc(100% - var(--flightplan-table-row-airwaylink-right, calc(100% - 1em)) - var(--flightplan-table-row-airwaylink-left, 0.25em));
                height: 100%;
            }
            #wrapper[airway="true"] #airwaylink {
                display: block;
            }
                #airwaylink #stem {
                    stroke-width: var(--flightplan-table-row-airwaylink-stroke-width, 0.2em);
                    fill: transparent;
                    transform: translate(calc(var(--flightplan-table-row-airwaylink-stroke-width, 0.2em) / 2), calc(-100% - var(--flightplan-table-row-airwaylink-stroke-width, 0.2em) / 2));
                }
            #grid {
                position: relative;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
                grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
            }
                #waypoint {
                    font-size: var(--flightplan-table-row-waypointbutton-font-size, 0.85em);
                    --button-padding-left: var(--flightplan-table-row-leg-waypointbutton-padding-left, 1.5em);
                }
                #wrapper[airway="true"] #waypoint {
                    justify-self: end;
                    width: calc(var(--flightplan-table-row-airwaylink-right, calc(100% - 1em)) - var(--flightplan-table-row-airwaylink-left, 0.25em));
                    --button-padding-left: var(--flightplan-table-row-leg-waypointbutton-airway-padding-left, 0.5em);
                }
                #datafields {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: grid;
                    grid-template-columns: 100%;
                    grid-template-rows: 50% 50%;
                    justify-items: end;
                    align-items: center;
                    transform: rotateX(0deg);
                }
                    wt-navdatainfo-view {
                        height: auto;
                        --navdatainfo-justify-content: flex-end;
                    }
                    #wrapper[active="true"] wt-navdatainfo-view {
                        --navdatainfo-value-color: var(--wt-g3x5-purple);
                    }

        .${WT_G3x5_TSCFlightPlanRowLegHTMLElement.UNIT_CLASS} {
            font-size: var(--flightplan-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <svg id="airwaylink">
            <defs>
                <linearGradient id="airwaylink-gradient" gradientTransform="rotate(90)">
                    <stop offset="55%" stop-color="#bce8eb" stop-opacity="0" />
                    <stop offset="70%" stop-color="#bce8eb" stop-opacity="1" />
                </linearGradient>
            </defs>
            <rect id="stem" x="0" y="0" rx="10" ry="10" width="200%" height="200%" stroke="url(#airwaylink-gradient)" />
        </svg>
        <div id="grid">
            <wt-tsc-button-fpwaypoint id="waypoint"></wt-tsc-button-fpwaypoint>
            <wt-tsc-button-content id="altconstraintbutton">
                <wt-tsc-flightplan-row-altitudeconstraint id="altconstraint" slot="content"></wt-tsc-flightplan-row-altitudeconstraint>
            </wt-tsc-button-content>
            <div id="datafields">
                <wt-navdatainfo-view id="datafield1"></wt-navdatainfo-view>
                <wt-navdatainfo-view id="datafield2"></wt-navdatainfo-view>
            </div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowLegHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowLegHTMLElement);

class WT_G3x5_TSCFlightPlanRowAirwaySequenceFooterHTMLElement extends WT_G3x5_TSCFlightPlanRowLegHTMLElement {
    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateLegDistance(value) {
        value.set(this.leg ? this.leg.parent.distance : NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateDTK(value) {
        value.set(NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateETE(value) {
        if (this.leg) {
            let distanceNM = this.leg.parent.distance.asUnit(WT_Unit.NMILE);
            let speedKnots = this._instrument.airplane.navigation.groundSpeed(this._tempKnots).number;
            value.set(distanceNM / speedKnots, WT_Unit.HOUR);
        } else {
            value.set(NaN);
        }
    }
}
WT_G3x5_TSCFlightPlanRowAirwaySequenceFooterHTMLElement.NAME = "wt-tsc-flightplan-row-airwayfooter";

customElements.define(WT_G3x5_TSCFlightPlanRowAirwaySequenceFooterHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowAirwaySequenceFooterHTMLElement);

class WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._constraint = null;
        this._altitudeUnit = null;
        this._isInit = false;

        this._initFormatter();
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.TEMPLATE;
    }

    _initFormatter() {
        let formatterOpts = {
            precision: 1,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                _numberClassList: [],
                _unitClassList: [WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.UNIT_CLASS],
                getNumberClassList() {
                    return this._numberClassList;
                },
                getUnitClassList() {
                    return this._unitClassList;
                }
            }
        };
        this._altitudeFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._ceilText = this.shadowRoot.querySelector(`#ceiltext`);
        this._floorText = this.shadowRoot.querySelector(`#floortext`);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._doUpdate();
    }

    _displayNone() {
        this._ceilText.innerHTML = `_____${this._altitudeFormatter.getFormattedUnitHTML(WT_Unit.FOOT.createNumber(0), this._altitudeUnit)}`;
        this._wrapper.setAttribute("mode", "none");
    }

    _displayAdvisoryAltitude(altitude) {
        this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(altitude, this._altitudeUnit);
        this._wrapper.setAttribute("mode", "advisory");
    }

    /**
     *
     * @param {WT_AltitudeConstraint} constraint
     */
    _displayPublishedConstraint(constraint) {
        switch (constraint.type) {
            case WT_AltitudeConstraint.Type.AT_OR_ABOVE:
                this._floorText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.floor, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "above");
                break;
            case WT_AltitudeConstraint.Type.AT_OR_BELOW:
                this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.ceiling, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "below");
                break;
            case WT_AltitudeConstraint.Type.AT:
                this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.ceiling, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "at");
                break;
            case WT_AltitudeConstraint.Type.BETWEEN:
                this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.ceiling, this._altitudeUnit);
                this._floorText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.floor, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "between");
                break;
        }
    }

    _doUpdate() {
        if (this._constraint) {
            if (this._constraint.advisoryAltitude) {
                this._displayAdvisoryAltitude(this._constraint.advisoryAltitude);
            } else if (this._constraint.publishedConstraint) {
                this._displayPublishedConstraint(this._constraint.publishedConstraint);
            } else {
                this._displayNone();
            }
        } else {
            this._displayNone();
        }
    }

    /**
     *
     * @param {WT_FlightPlanLegAltitudeConstraint} constraint
     */
    update(constraint, altitudeUnit) {
        this._constraint = constraint;
        this._altitudeUnit = altitudeUnit;
        if (this._isInit) {
            this._doUpdate();
        }
    }
}
WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.NAME = "wt-tsc-flightplan-row-altitudeconstraint";
WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: absolute;
            left: var(--flightplanaltitudeconstraint-padding-left, 0.2em);
            top: var(--flightplanaltitudeconstraint-padding-top, 0.2em);
            width: calc(100% - var(--flightplanaltitudeconstraint-padding-left, 0.2em) - var(--flightplanaltitudeconstraint-padding-right, 0.2em));
            height: calc(100% - var(--flightplanaltitudeconstraint-padding-top, 0.2em) - var(--flightplanaltitudeconstraint-padding-bottom, 0.2em));
            color: white;
        }
            #altitude {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-flow: column nowrap;
                align-items: center;
            }
                .altitudeComponent {
                    display: none;
                }
                #wrapper[mode="none"] .none,
                #wrapper[mode="advisory"] .advisory,
                #wrapper[mode="above"] .above,
                #wrapper[mode="below"] .below,
                #wrapper[mode="at"] .at,
                #wrapper[mode="between"] .between {
                    display: block;
                }
                #ceilbar {
                    width: 100%;
                    height: 0;
                    border-bottom: solid var(--flightplanaltitudeconstraint-bar-stroke-width, 2px) white;
                }
                #floorbar {
                    width: 100%;
                    height: 0;
                    border-top: solid var(--flightplanaltitudeconstraint-bar-stroke-width, 2px) white;
                }

        .${WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.UNIT_CLASS} {
            font-size: var(--flightplanaltitudeconstraint-unit-font-size, 0.75em)
        }
    </style>
    <div id="wrapper">
        <div id="altitude">
            <div id="ceilbar" class="altitudeComponent between at below"></div>
            <div id="ceiltext" class="altitudeComponent between at below advisory none"></div>
            <div id="floortext" class="altitudeComponent between above"></div>
            <div id="floorbar" class="altitudeComponent between at above"></div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.NAME, WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement);

class WT_G3x5_TSCFlightPlanRowHeaderHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._sequence = null;
        this._titleText = "";
        this._subtitleText = "";
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    /**
     * @readonly
     * @type {WT_FlightPlanSequence}
     */
    get sequence() {
        return this._sequence;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._button = await WT_CustomElementSelector.select(this.shadowRoot, `#header`, WT_TSCContentButton);

        this._title = this.shadowRoot.querySelector(`#title`);
        this._subtitle = this.shadowRoot.querySelector(`#subtitle`);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._updateFromSequence();
        this._updateFromTitleText();
        this._updateFromSubtitleText();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _clearAirway() {
        this._wrapper.setAttribute("airway", "false");
    }

    _updateAirwayFromSequence() {
        this._wrapper.setAttribute("airway", `${this._sequence instanceof WT_FlightPlanAirwaySequence}`);
    }

    _updateFromSequence() {
        if (this._sequence) {
            this._updateAirwayFromSequence();
        } else {
            this._clearAirway();
        }
    }

    /**
     *
     * @param {WT_FlightPlanSequence} sequence
     */
    setSequence(sequence) {
        this._sequence = sequence;
        if (this._isInit) {
            this._updateFromSequence();
        }
    }

    _updateFromTitleText() {
        this._title.innerHTML = this._titleText;
    }

    setTitleText(text) {
        if (this._titleText === text) {
            return;
        }

        this._titleText = text;
        if (this._isInit) {
            this._updateFromTitleText();
        }
    }

    _updateFromSubtitleText() {
        this._subtitle.innerHTML = this._subtitleText;
    }

    setSubtitleText(text) {
        if (this._subtitleText === text) {
            return;
        }

        this._subtitleText = text;
        if (this._isInit) {
            this._updateFromSubtitleText();
        }
    }

    addButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._button.addButtonListener(listener);
    }

    removeButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._button.removeButtonListener(listener);
    }

    onUnselected() {
        this._button.highlight = "false";
    }

    onSelected() {
        this._button.highlight = "true";
    }
}
WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.NAME = "wt-tsc-flightplan-row-header";
WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
            grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
        }
            #header {
                grid-column: 1 / span 3;
            }
                #headercontent {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-flow: column nowrap;
                    justify-content: center;
                    align-items: center;
                }
                    #title {
                        color: var(--wt-g3x5-lightblue);
                    }
                    #subtitle {
                        color: white;
                    }
                    #header[highlight=true][primed=false] #title,
                    #header[highlight=true][primed=false] #subtitle {
                        color: black;
                    }
            #airwaylink {
                display: none;
                position: absolute;
                left: calc(var(--flightplan-table-row-airwaylink-left, 0.25em) + var(--flightplan-table-row-airwaylink-stroke-width, 0.2em) / 2);
                top: 50%;
                width: var(--flightplan-table-row-airwaylink-header-size, 0.5em);
                height: var(--flightplan-table-row-airwaylink-header-size, 0.5em);
                transform: translate(-50%, -50%);
            }
                #wrapper[airway="true"] #airwaylink {
                    display: block;
                }
    </style>
    <div id="wrapper">
        <wt-tsc-button-content id="header">
            <div id="headercontent" slot="content">
                <div id="title"></div>
                <div id="subtitle"></div>
            </div>
        </wt-tsc-button-content>
        <svg id="airwaylink" viewBox="0 0 100 100">
            <defs>
                <radialGradient id="airwaylink-header-gradient">
                    <stop offset="70%" stop-color="#bce8eb" stop-opacity="1" />
                    <stop offset="100%" stop-color="#bce8eb" stop-opacity="0" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#airwaylink-header-gradient)" />
        </svg>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowHeaderHTMLElement);

class WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    async _defineChildren() {
        [
            this._addButton,
            this._doneButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#enroutefooteradd`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#enroutefooterdone`, WT_TSCLabeledButton)
        ]);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    addAddButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._addButton.addButtonListener(listener);
    }

    removeAddButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._addButton.removeButtonListener(listener);
    }

    addDoneButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._doneButton.addButtonListener(listener);
    }

    removeDoneButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._doneButton.removeButtonListener(listener);
    }

    onUnselected() {
    }

    onSelected() {
    }
}
WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.NAME = "wt-tsc-flightplan-row-enroutefooter";
WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
            grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
        }
            #enroutefooter {
                color: white;
            }
                #enroutefooteradd {
                    grid-column: 1 / span 2;
                }
    </style>
    <div id="wrapper">
        <wt-tsc-button-label id="enroutefooteradd" labeltext="Add Enroute Waypoint"></wt-tsc-button-label>
        <wt-tsc-button-label id="enroutefooterdone" labeltext="Done"></wt-tsc-button-label>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement);

class WT_G3x5_TSCFlightPlanRenderer {
    /**
     * @param {WT_FlightPlan} flightPlan
     */
    constructor(flightPlan) {
        this._flightPlan = flightPlan;

        this._origin = new WT_G3x5_TSCFlightPlanOriginRenderer(this, flightPlan.getOrigin());
        this._enroute = new WT_G3x5_TSCFlightPlanEnrouteRenderer(this, flightPlan.getEnroute());
        this._destination = new WT_G3x5_TSCFlightPlanDestinationRenderer(this, flightPlan.getDestination());

        this._departure = null;
        this._arrival = null;
        this._approach = null;

        /**
         * @type {Map<WT_FlightPlanLeg,WT_G3x5_TSCFlightPlanRowHTMLElement>}
         */
        this._legRows = new Map();
        /**
         * @type {WT_FlightPlanLeg}
         */
        this._activeLeg = null;
    }

    /**
     * @readonly
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    /**
     * @readonly
     * @type {WT_FlightPlanLeg}
     */
    get activeLeg() {
        return this._activeLeg;
    }

    clearLegRows() {
        this._legRows.clear();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     */
    registerLegRow(leg, row) {
        this._legRows.set(leg, row);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_FlightPlanLeg} [activeLeg]
     */
    draw(htmlElement, activeLeg) {
        this.clearLegRows();
        this._updateActiveLeg(htmlElement, activeLeg ? activeLeg : null);

        if (this.flightPlan.hasDeparture()) {
            this._departure = new WT_G3x5_TSCFlightPlanDepartureRenderer(this, this.flightPlan.getDeparture());
            this._departure.draw(htmlElement);
        } else {
            this._origin.draw(htmlElement);
            this._departure = null;
        }
        this._enroute.draw(htmlElement);
        if (this.flightPlan.hasArrival()) {
            this._arrival = new WT_G3x5_TSCFlightPlanArrivalRenderer(this, this.flightPlan.getArrival());
            this._arrival.draw(htmlElement);
        } else {
            this._destination.draw(htmlElement);
            this._arrival = null;
        }
        if (this.flightPlan.hasApproach()) {
            this._approach = new WT_G3x5_TSCFlightPlanApproachRenderer(this, this.flightPlan.getApproach());
            this._approach.draw(htmlElement);
        } else {
            this._approach = null;
        }
    }

    updateAltitudeConstraint(leg) {
        let row = this._legRows.get(leg);
        if (row) {
            row.getActiveModeHTMLElement().updateAltitudeConstraint();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _updateActiveLeg(htmlElement, activeLeg) {
        if (this._activeLeg === activeLeg) {
            return;
        }

        // check if old or new active leg is part of a collapsed airway sequence
        let oldCollapsed = false;
        let newCollapsed = false;
        if (this._activeLeg && this._activeLeg.parent instanceof WT_FlightPlanAirwaySequence) {
            oldCollapsed = htmlElement.getAirwaySequenceCollapse(this._activeLeg.parent);
        }
        if (activeLeg && activeLeg.parent instanceof WT_FlightPlanAirwaySequence) {
            newCollapsed = htmlElement.getAirwaySequenceCollapse(activeLeg.parent);
        }

        // figure out if we need to redraw the flight plan in order to uncollapse or recollapse an airway sequence
        let needRedraw = (oldCollapsed !== newCollapsed) || ((oldCollapsed || newCollapsed) && this._activeLeg.parent !== activeLeg.parent);

        this._activeLeg = activeLeg;
        if (needRedraw) {
            htmlElement.clearRows();
            this.draw(htmlElement, activeLeg);
        }
        let showArrow = false;
        if (activeLeg) {
            let previousLeg = activeLeg.previousLeg();
            if (previousLeg) {
                let activeLegRow = this._legRows.get(activeLeg);
                let previousLegRow = this._legRows.get(previousLeg);
                if (activeLegRow && previousLegRow) {
                    let previousLegCenterY = previousLegRow.offsetTop + previousLegRow.offsetHeight / 2;
                    let activeLegCenterY = activeLegRow.offsetTop + activeLegRow.offsetHeight / 2;
                    htmlElement.moveActiveArrow(previousLegCenterY, activeLegCenterY);
                    showArrow = true;
                }
            }
        }
        htmlElement.setActiveArrowVisible(showArrow);
    }

    _updateChildren(htmlElement, state) {
        if (this._departure) {
            this._departure.update(htmlElement, state);
        } else {
            this._origin.update(htmlElement, state);
        }
        this._enroute.update(htmlElement, state);
        if (this._arrival) {
            this._arrival.update(htmlElement, state);
        } else {
            this._destination.update(htmlElement, state);
        }
        if (this._approach) {
            this._approach.update(htmlElement, state);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(htmlElement, state) {
        this._updateActiveLeg(htmlElement, state.activeLeg);
        this._updateChildren(htmlElement, state);
    }
}

/**
 * @template {WT_FlightPlanElement} T
 */
class WT_G3x5_TSCFlightPlanElementRenderer {
    /**
     * @param {WT_G3x5_TSCFlightPlanRenderer} parent
     * @param {T} element
     */
    constructor(parent, element) {
        this._parent = parent;
        this._element = element;
    }

    /**
     * @readonly
     * @type {T}
     */
    get element() {
        return this._element;
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(htmlElement) {
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(htmlElement, state) {
    }
}

/**
 * @template {WT_FlightPlanSequence} T
 * @extends WT_G3x5_TSCFlightPlanElementRenderer<T>
 */
class WT_G3x5_TSCFlightPlanSequenceRenderer extends WT_G3x5_TSCFlightPlanElementRenderer {
    /**
     * @param {WT_G3x5_TSCFlightPlanRenderer} parent
     * @param {T} sequence
     */
    constructor(parent, sequence) {
        super(parent, sequence);

        /**
         * @type {WT_G3x5_TSCFlightPlanElementRenderer[]}
         */
        this._children = [];
    }

    _mapElementToRenderer(element) {
        if (element instanceof WT_FlightPlanAirwaySequence) {
            return new WT_G3x5_FlightPlanAirwayRenderer(this._parent, element);
        } else if (element instanceof WT_FlightPlanLeg) {
            return new WT_G3x5_TSCFlightPlanLegRenderer(this._parent, element);
        }
        return null;
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _initChildren(htmlElement) {
        this._children = this.element.elements.map(this._mapElementToRenderer.bind(this));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        this._header = htmlElement.requestRow();
        this._header.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER);
        this._headerModeHTMLElement = this._header.getActiveModeHTMLElement();
        this._headerModeHTMLElement.setSequence(this.element);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawChildren(htmlElement) {
        this._children.forEach(child => child.draw(htmlElement));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(htmlElement) {
        this._initChildren(htmlElement);
        this._drawHeader(htmlElement);
        this._drawChildren(htmlElement);
    }

    _updateChildren(htmlElement, state) {
        this._children.forEach(child => child.update(htmlElement, state));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(htmlElement, state) {
        this._updateChildren(htmlElement, state);
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSequenceRenderer<WT_FlightPlanAirwaySequence>
 */
class WT_G3x5_FlightPlanAirwayRenderer extends WT_G3x5_TSCFlightPlanSequenceRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _initChildren(htmlElement) {
        let shouldCollapse = !(this._parent.activeLeg && this.element === this._parent.activeLeg.parent) && htmlElement.getAirwaySequenceCollapse(this.element);
        if (shouldCollapse) {
            this._children.push(new WT_G3x5_TSCFlightPlanAirwaySequenceFooterRenderer(this._parent, this.element.legs.last()));
        } else {
            this._children = this.element.elements.map(this._mapElementToRenderer.bind(this));
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        super._drawHeader(htmlElement);

        this._headerModeHTMLElement.setTitleText(`Airway – ${this.element.airway.name}.${this.element.legs.last().fix.ident}`);
        this._headerModeHTMLElement.setSubtitleText("");
    }
}

/**
 * @template {WT_FlightPlanSegment} T
 * @extends WT_G3x5_TSCFlightPlanSequenceRenderer<T>
 */
class WT_G3x5_TSCFlightPlanSegmentRenderer extends WT_G3x5_TSCFlightPlanSequenceRenderer {
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanOrigin>
 */
class WT_G3x5_TSCFlightPlanOriginRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        super._drawHeader(htmlElement);

        if (this.element.waypoint) {
            this._headerModeHTMLElement.setTitleText(`Origin – ${this.element.waypoint.ident}`);
            this._headerModeHTMLElement.setSubtitleText("");
        } else {
            this._headerModeHTMLElement.setTitleText("");
            this._headerModeHTMLElement.setSubtitleText("Add Origin");
        }
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanDestination>
 */
class WT_G3x5_TSCFlightPlanDestinationRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        super._drawHeader(htmlElement);

        if (this.element.waypoint) {
            this._headerModeHTMLElement.setTitleText(`Destination – ${this.element.waypoint.ident}`);
            this._headerModeHTMLElement.setSubtitleText("");
        } else {
            this._headerModeHTMLElement.setTitleText("");
            this._headerModeHTMLElement.setSubtitleText("Add Destination");
        }
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanDeparture>
 */
class WT_G3x5_TSCFlightPlanDepartureRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _initChildren(htmlElement) {
        super._initChildren(htmlElement);

        if (!this.element.procedure.runwayTransitions.getByIndex(this.element.runwayTransitionIndex)) {
            // if the departure does not have a runway selected, add the origin as the first "leg"
            this._children.unshift(new WT_G3x5_TSCFlightPlanLegRenderer(this._parent, this.element.flightPlan.getOrigin().leg()));
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        super._drawHeader(htmlElement);

        let departure = this.element.procedure;
        let rwyTransition = departure.runwayTransitions.getByIndex(this.element.runwayTransitionIndex);
        let enrouteTransition = departure.enrouteTransitions.getByIndex(this.element.enrouteTransitionIndex);
        let prefix = `${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}.`;
        let suffix = (enrouteTransition && this.element.legs.length > 0) ? `.${this.element.legs.last().fix.ident}` : "";
        this._headerModeHTMLElement.setTitleText(`Departure –<br>${departure.airport.ident}–${prefix}${departure.name}${suffix}`);
        this._headerModeHTMLElement.setSubtitleText("");
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanEnroute>
 */
class WT_G3x5_TSCFlightPlanEnrouteRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        if (this.element.length > 0) {
            super._drawHeader(htmlElement);
            this._headerModeHTMLElement.setTitleText("Enroute");
            this._headerModeHTMLElement.setSubtitleText("");
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawFooter(htmlElement) {
        this._footer = htmlElement.requestRow();
        this._footer.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(htmlElement) {
        super.draw(htmlElement);

        this._drawFooter(htmlElement);
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanArrival>
 */
class WT_G3x5_TSCFlightPlanArrivalRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _initChildren(htmlElement) {
        super._initChildren(htmlElement);

        // we need to manually add the destination "leg" to the end of the arrival since the sim doesn't give it to us automatically
        this._children.push(new WT_G3x5_TSCFlightPlanLegRenderer(this._parent, this.element.flightPlan.getDestination().leg()));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        super._drawHeader(htmlElement);

        let arrival = this.element.procedure;
        let enrouteTransition = arrival.enrouteTransitions.getByIndex(this.element.enrouteTransitionIndex);
        let rwyTransition = arrival.runwayTransitions.getByIndex(this.element.runwayTransitionIndex);
        let prefix = (enrouteTransition && this.element.legs.length > 0) ? `${this.element.legs.first().fix.ident}.` : "";
        let suffix = `.${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}`;
        this._headerModeHTMLElement.setTitleText(`Arrival –<br>${arrival.airport.ident}–${prefix}${arrival.name}${suffix}`);
        this._headerModeHTMLElement.setSubtitleText("");
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanApproach>
 */
class WT_G3x5_TSCFlightPlanApproachRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        super._drawHeader(htmlElement);

        let approach = this.element.procedure;
        this._headerModeHTMLElement.setTitleText(`Approach –<br>${approach.airport.ident}–${approach.name}`);
        this._headerModeHTMLElement.setSubtitleText("");
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanElementRenderer<WT_FlightPlanLeg>
 */
class WT_G3x5_TSCFlightPlanLegRenderer extends WT_G3x5_TSCFlightPlanElementRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(htmlElement) {
        this._row = htmlElement.requestRow();
        this._row.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);

        this._modeHTMLElement = this._row.getActiveModeHTMLElement();
        this._modeHTMLElement.setLeg(this.element);

        this._parent.registerLegRow(this.element, this._row);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    _updateModeHTMLElement(htmlElement, state) {
        this._modeHTMLElement.update(state.airplaneHeadingTrue, state.unitsModel, state.settings.dataFieldSettings);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    _updateActive(htmlElement, state) {
        this._modeHTMLElement.setActive(state.activeLeg === this.element);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(htmlElement, state) {
        this._updateModeHTMLElement(htmlElement, state);
        this._updateActive(htmlElement, state);
    }
}

class WT_G3x5_TSCFlightPlanAirwaySequenceFooterRenderer extends WT_G3x5_TSCFlightPlanLegRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(htmlElement) {
        this._row = htmlElement.requestRow();
        this._row.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER);

        this._modeHTMLElement = this._row.getActiveModeHTMLElement();
        this._modeHTMLElement.setLeg(this.element);

        this._parent.registerLegRow(this.element, this._row);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(htmlElement, state) {
        this._updateModeHTMLElement(htmlElement, state);
    }
}