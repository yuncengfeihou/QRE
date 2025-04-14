// events.js
import * as Constants from './constants.js';
import { sharedState, setMenuVisible } from './state.js';
import { updateMenuVisibilityUI } from './ui.js';
import { triggerQuickReply } from './api.js';
import { handleSettingsChange } from './settings.js';

/**
 * Handles clicks on the rocket button. Toggles menu visibility state and updates UI.
 */
export function handleRocketButtonClick() {
    setMenuVisible(!sharedState.menuVisible); // Toggle state
    updateMenuVisibilityUI(); // Update UI based on new state
}

/**
 * Handles clicks outside the menu to close it.
 * @param {Event} event
 */
export function handleOutsideClick(event) {
    const { menu, rocketButton } = sharedState.domElements;
    if (sharedState.menuVisible &&
        menu && rocketButton &&
        !menu.contains(event.target) &&
        event.target !== rocketButton &&
        !rocketButton.contains(event.target)
       ) {
        setMenuVisible(false); // Update state
        updateMenuVisibilityUI(); // Update UI
    }
}

/**
 * Handles clicks on individual quick reply items (buttons).
 * Reads data attributes and triggers the API call.
 * @param {Event} event The click event on the button.
 */
export async function handleQuickReplyClick(event) {
    const button = event.currentTarget; // Get the button that was clicked
    const setName = button.dataset.setName;
    const label = button.dataset.label;

    if (!setName || !label) {
        console.error(`[${Constants.EXTENSION_NAME}] Missing data-set-name or data-label on clicked item.`);
        setMenuVisible(false); // Close menu on error
        updateMenuVisibilityUI();
        return;
    }

    await triggerQuickReply(setName, label); // Await the API call

    // Always close the menu after attempting to trigger, regardless of success/failure
    setMenuVisible(false);
    updateMenuVisibilityUI();
}

/**
 * Sets up all event listeners for the plugin.
 */
export function setupEventListeners() {
    const { 
        rocketButton, 
        settingsDropdown,
        iconTypeDropdown,
        customIconUrl,
        colorMatchCheckbox
    } = sharedState.domElements;

    rocketButton?.addEventListener('click', handleRocketButtonClick);
    document.addEventListener('click', handleOutsideClick);

    // Settings listeners
    settingsDropdown?.addEventListener('change', handleSettingsChange);
    
    // 新增图标设置相关监听器
    iconTypeDropdown?.addEventListener('change', handleSettingsChange);
    customIconUrl?.addEventListener('input', handleSettingsChange);
    colorMatchCheckbox?.addEventListener('change', handleSettingsChange);
    
    // 添加菜单样式按钮监听器
    const menuStyleButton = document.getElementById(Constants.ID_MENU_STYLE_BUTTON);
    menuStyleButton?.addEventListener('click', handleMenuStyleButtonClick);
    
    // 添加菜单样式面板相关监听器
    const closeButton = document.getElementById(`${Constants.ID_MENU_STYLE_PANEL}-close`);
    closeButton?.addEventListener('click', closeMenuStylePanel);
    
    const applyButton = document.getElementById(`${Constants.ID_MENU_STYLE_PANEL}-apply`);
    applyButton?.addEventListener('click', applyMenuStyles);
    
    const resetButton = document.getElementById(Constants.ID_RESET_STYLE_BUTTON);
    resetButton?.addEventListener('click', resetMenuStyles);
    
    // 添加不透明度滑块变化监听器
    const itemOpacitySlider = document.getElementById('qr-item-opacity');
    itemOpacitySlider?.addEventListener('input', function() {
        document.getElementById('qr-item-opacity-value').textContent = this.value;
    });
    
    const menuOpacitySlider = document.getElementById('qr-menu-opacity');
    menuOpacitySlider?.addEventListener('input', function() {
        document.getElementById('qr-menu-opacity-value').textContent = this.value;
    });
    
    // 跟随主题复选框监听器
    const followThemeCheckbox = document.getElementById(Constants.ID_FOLLOW_THEME_CHECKBOX);
    followThemeCheckbox?.addEventListener('change', function() {
        // 禁用或启用颜色选择控件
        const colorPickers = document.querySelectorAll('.qr-color-picker, .qr-opacity-slider');
        colorPickers.forEach(picker => {
            picker.disabled = this.checked;
        });
    });
}
