// events.js
import * as Constants from './constants.js';
import { sharedState, setMenuVisible } from './state.js';
import { updateMenuVisibilityUI } from './ui.js';
import { triggerQuickReply } from './api.js';
import { handleSettingsChange } from './settings.js';
import { extension_settings } from './index.js';

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
 * 处理菜单样式按钮点击
 */
export function handleMenuStyleButtonClick() {
    const stylePanel = document.getElementById(Constants.ID_MENU_STYLE_PANEL);
    if (stylePanel) {
        // 载入当前样式到面板
        loadMenuStylesIntoPanel();
        stylePanel.style.display = 'block';
    }
}

/**
 * 将当前菜单样式加载到设置面板中
 */
function loadMenuStylesIntoPanel() {
    const settings = extension_settings[Constants.EXTENSION_NAME];
    // 确保menuStyles存在，否则使用默认值
    const styles = settings.menuStyles || JSON.parse(JSON.stringify(Constants.DEFAULT_MENU_STYLES));
    
    // 设置各个控件的值时添加检查
    document.getElementById('qr-item-bgcolor-picker').value = 
        styles.itemBgColor && typeof styles.itemBgColor === 'string' ? rgbaToHex(styles.itemBgColor) : '#3c3c3c';
    document.getElementById('qr-item-opacity').value = 
        styles.itemBgColor && typeof styles.itemBgColor === 'string' ? getOpacityFromRgba(styles.itemBgColor) : 0.7;
    document.getElementById('qr-item-opacity-value').textContent = 
        styles.itemBgColor && typeof styles.itemBgColor === 'string' ? getOpacityFromRgba(styles.itemBgColor) : 0.7;
    
    document.getElementById('qr-item-color-picker').value = styles.itemTextColor || '#ffffff';
    document.getElementById('qr-title-color-picker').value = styles.titleColor || '#cccccc';
    document.getElementById('qr-title-border-picker').value = styles.titleBorderColor || '#444444';
    document.getElementById('qr-empty-color-picker').value = styles.emptyTextColor || '#666666';
    
    document.getElementById('qr-menu-bgcolor-picker').value = 
        styles.menuBgColor && typeof styles.menuBgColor === 'string' ? rgbaToHex(styles.menuBgColor) : '#000000';
    document.getElementById('qr-menu-opacity').value = 
        styles.menuBgColor && typeof styles.menuBgColor === 'string' ? getOpacityFromRgba(styles.menuBgColor) : 0.85;
    document.getElementById('qr-menu-opacity-value').textContent = 
        styles.menuBgColor && typeof styles.menuBgColor === 'string' ? getOpacityFromRgba(styles.menuBgColor) : 0.85;
    
    document.getElementById('qr-menu-border-picker').value = styles.menuBorderColor || '#555555';
    document.getElementById(Constants.ID_FOLLOW_THEME_CHECKBOX).checked = styles.followTheme || false;
    
    // 根据跟随主题状态禁用/启用颜色选择控件
    const colorPickers = document.querySelectorAll('.qr-color-picker, .qr-opacity-slider');
    colorPickers.forEach(picker => {
        picker.disabled = styles.followTheme || false;
    });
}

/**
 * 关闭菜单样式面板
 */
export function closeMenuStylePanel() {
    const stylePanel = document.getElementById(Constants.ID_MENU_STYLE_PANEL);
    if (stylePanel) {
        stylePanel.style.display = 'none';
    }
}

/**
 * 从样式面板中收集样式设置并应用
 */
export function applyMenuStyles() {
    const settings = extension_settings[Constants.EXTENSION_NAME];
    if (!settings.menuStyles) {
        settings.menuStyles = JSON.parse(JSON.stringify(Constants.DEFAULT_MENU_STYLES));
    }
    
    // 获取面板中的设置值
    const itemBgColor = document.getElementById('qr-item-bgcolor-picker').value;
    const itemOpacity = document.getElementById('qr-item-opacity').value;
    settings.menuStyles.itemBgColor = hexToRgba(itemBgColor, itemOpacity);
    
    settings.menuStyles.itemTextColor = document.getElementById('qr-item-color-picker').value;
    settings.menuStyles.titleColor = document.getElementById('qr-title-color-picker').value;
    settings.menuStyles.titleBorderColor = document.getElementById('qr-title-border-picker').value;
    settings.menuStyles.emptyTextColor = document.getElementById('qr-empty-color-picker').value;
    
    const menuBgColor = document.getElementById('qr-menu-bgcolor-picker').value;
    const menuOpacity = document.getElementById('qr-menu-opacity').value;
    settings.menuStyles.menuBgColor = hexToRgba(menuBgColor, menuOpacity);
    
    settings.menuStyles.menuBorderColor = document.getElementById('qr-menu-border-picker').value;
    settings.menuStyles.followTheme = document.getElementById(Constants.ID_FOLLOW_THEME_CHECKBOX).checked;
    
    // 应用样式到菜单
    updateMenuStylesUI();
    
    // 关闭面板
    closeMenuStylePanel();
    
    // 保存设置到localStorage
    try {
        localStorage.setItem('QRA_settings', JSON.stringify(settings));
    } catch(e) {
        console.error('保存到localStorage失败:', e);
    }
}

/**
 * 重置样式到默认值
 */
export function resetMenuStyles() {
    const settings = extension_settings[Constants.EXTENSION_NAME];
    settings.menuStyles = JSON.parse(JSON.stringify(Constants.DEFAULT_MENU_STYLES));
    
    // 重新加载面板
    loadMenuStylesIntoPanel();
    
    // 应用默认样式
    updateMenuStylesUI();
}

/**
 * 更新菜单的实际样式
 */
export function updateMenuStylesUI() {
    const settings = extension_settings[Constants.EXTENSION_NAME];
    const styles = settings.menuStyles || Constants.DEFAULT_MENU_STYLES;
    
    const menu = document.getElementById(Constants.ID_MENU);
    if (!menu) return;
    
    // 如果启用了跟随主题
    if (styles.followTheme) {
        // 1. 移除所有自定义样式
        menu.classList.remove('custom-styled-menu');
        menu.classList.add('inherit-host-theme');
        
        // 2. 直接复制body的所有类到菜单
        menu.className = 'inherit-host-theme';
        menu.classList.add(Constants.ID_MENU); // 保留ID对应的类
        const bodyClasses = Array.from(document.body.classList);
        bodyClasses.forEach(cls => menu.classList.add(cls));
        
        // 3. 给菜单内部元素添加宿主应用正在使用的类
        // 获取宿主应用常用的类
        const hostPanelClass = document.querySelector('.inline-drawer, .card, .content') ? 
            (document.querySelector('.inline-drawer')?.className || 
             document.querySelector('.card')?.className || 
             document.querySelector('.content')?.className) : '';
             
        const hostButtonClass = document.querySelector('.menu_button, .btn-primary, .btn') ?
            (document.querySelector('.menu_button')?.className || 
             document.querySelector('.btn-primary')?.className || 
             document.querySelector('.btn')?.className) : '';
             
        const hostTitleClass = document.querySelector('.inline-drawer-header, h4, .card-header') ?
            (document.querySelector('.inline-drawer-header')?.className || 
             document.querySelector('h4')?.className || 
             document.querySelector('.card-header')?.className) : '';
        
        // 应用宿主应用类到菜单元素
        menu.querySelectorAll('.quick-reply-list').forEach(el => {
            el.className = 'quick-reply-list';
            if (hostPanelClass) {
                hostPanelClass.split(' ').forEach(cls => {
                    if (cls) el.classList.add(cls);
                });
            }
        });
        
        menu.querySelectorAll('.quick-reply-item').forEach(el => {
            el.className = 'quick-reply-item';
            if (hostButtonClass) {
                hostButtonClass.split(' ').forEach(cls => {
                    if (cls) el.classList.add(cls);
                });
            }
        });
        
        menu.querySelectorAll('.quick-reply-list-title').forEach(el => {
            el.className = 'quick-reply-list-title';
            if (hostTitleClass) {
                hostTitleClass.split(' ').forEach(cls => {
                    if (cls) el.classList.add(cls);
                });
            }
        });
        
        // 移除CSS变量自定义样式
        document.documentElement.style.removeProperty('--qr-item-bg-color');
        document.documentElement.style.removeProperty('--qr-item-text-color');
        document.documentElement.style.removeProperty('--qr-title-color');
        document.documentElement.style.removeProperty('--qr-title-border-color');
        document.documentElement.style.removeProperty('--qr-empty-text-color');
        document.documentElement.style.removeProperty('--qr-menu-bg-color');
        document.documentElement.style.removeProperty('--qr-menu-border-color');
    } else {
        // 恢复自定义样式
        // 移除所有可能的继承类
        const originalClass = menu.className;
        menu.className = '';
        menu.classList.add(Constants.ID_MENU);
        menu.classList.add('custom-styled-menu');
        
        // 恢复菜单内部元素的原始类
        menu.querySelectorAll('.quick-reply-list, .quick-reply-item, .quick-reply-list-title, .quick-reply-empty').forEach(el => {
            // 保留第一个类(基本类)，移除其他所有类
            const baseClass = el.classList[0];
            el.className = baseClass || '';
        });
        
        // 应用自定义样式
        document.documentElement.style.setProperty('--qr-item-bg-color', styles.itemBgColor || 'rgba(60, 60, 60, 0.7)');
        document.documentElement.style.setProperty('--qr-item-text-color', styles.itemTextColor || 'white');
        document.documentElement.style.setProperty('--qr-title-color', styles.titleColor || '#ccc');
        document.documentElement.style.setProperty('--qr-title-border-color', styles.titleBorderColor || '#444');
        document.documentElement.style.setProperty('--qr-empty-text-color', styles.emptyTextColor || '#666');
        document.documentElement.style.setProperty('--qr-menu-bg-color', styles.menuBgColor || 'rgba(0, 0, 0, 0.85)');
        document.documentElement.style.setProperty('--qr-menu-border-color', styles.menuBorderColor || '#555');
    }
}

/**
 * 辅助函数 - hex转rgba
 */
function hexToRgba(hex, opacity) {
    if (!hex) return `rgba(60, 60, 60, ${opacity || 0.7})`;
    
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * 辅助函数 - rgba转hex
 */
function rgbaToHex(rgba) {
    // 添加防御性检查
    if (!rgba || typeof rgba !== 'string') {
        return '#000000'; // 返回默认黑色
    }
    
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (!match) {
        // 如果不是rgba格式，直接返回原值(如果是hex格式)或默认值
        return rgba.startsWith('#') ? rgba : '#000000';
    }
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

/**
 * 辅助函数 - 获取rgba的透明度值
 */
function getOpacityFromRgba(rgba) {
    if (!rgba || typeof rgba !== 'string') {
        return 1; // 默认不透明
    }
    
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (!match) return 1;
    return parseFloat(match[4] || 1);
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
