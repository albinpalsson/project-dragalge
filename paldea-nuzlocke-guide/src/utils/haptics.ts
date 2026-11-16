let iosSwitchLabel: HTMLLabelElement | undefined;

// iOS Safari has no Vibration API, but toggling a native `switch` checkbox
// (iOS 17.4+) plays a system haptic tick.
function tickViaSwitch() {
    if (!iosSwitchLabel) {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.setAttribute('switch', '');
        input.tabIndex = -1;
        const label = document.createElement('label');
        label.setAttribute('aria-hidden', 'true');
        label.style.cssText =
            'position:fixed;left:-100px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
        label.append(input);
        document.body.append(label);
        iosSwitchLabel = label;
    }
    iosSwitchLabel.click();
}

export function hapticTick() {
    if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(30);
        return;
    }
    tickViaSwitch();
}
