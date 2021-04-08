class WT_G3x5_ChartsICAOSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsICAOSetting.DEFAULT, key = WT_G3x5_ChartsICAOSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G3x5_ChartsICAOSetting.KEY = "WT_Charts_ICAO";
WT_G3x5_ChartsICAOSetting.DEFAULT = "";

class WT_G3x5_ChartsChartIDSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsChartIDSetting.DEFAULT, key = WT_G3x5_ChartsChartIDSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G3x5_ChartsChartIDSetting.KEY = "WT_Charts_ChartID";
WT_G3x5_ChartsChartIDSetting.DEFAULT = "";

class WT_G3x5_ChartsRotationSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsRotationSetting.DEFAULT, key = WT_G3x5_ChartsRotationSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }

    getRotation() {
        return this.getValue() * 90;
    }

    rotateCCW() {
        this.setValue((this.getValue() + 3) % 4); // add by 3 instead of subtracting 1 to avoid negative values
    }

    rotateCW() {
        this.setValue((this.getValue() + 1) % 4);
    }
}
WT_G3x5_ChartsRotationSetting.KEY = "WT_Charts_Rotation";
WT_G3x5_ChartsRotationSetting.DEFAULT = 0;

class WT_G3x5_ChartsZoomSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsZoomSetting.DEFAULT, scaleFactors = WT_G3x5_ChartsZoomSetting.SCALE_FACTORS, key = WT_G3x5_ChartsZoomSetting.KEY) {
        super(model, key, defaultValue, false, false);

        this._scaleFactors = scaleFactors;
        this._scaleFactorsReadOnly = new WT_ReadOnlyArray(this._scaleFactors);
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<Number>}
     */
    get scaleFactors() {
        return this._scaleFactorsReadOnly;
    }

    getScaleFactor() {
        return this._scaleFactors[this.getValue()];
    }

    changeZoom(delta) {
        let current = this.getValue();
        let target = Math.max(0, Math.min(this._scaleFactors.length - 1, current + delta));
        this.setValue(target);
    }
}
WT_G3x5_ChartsZoomSetting.KEY = "WT_Charts_Zoom";
WT_G3x5_ChartsZoomSetting.SCALE_FACTORS = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
WT_G3x5_ChartsZoomSetting.DEFAULT = 0;