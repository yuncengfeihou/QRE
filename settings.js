// settings.js
import { extension_settings } from "./index.js"; 
import * as Constants from './constants.js';
import { sharedState, setMenuVisible } from './state.js';
import { updateMenuVisibilityUI } from './ui.js';
import { updateMenuStylesUI } from './events.js';

// 在settings.js中添加自己的updateIconDisplay实现，避免循环依赖
function updateIconDisplay() {
    const button = sharedState.domElements.rocketButton;
    if (!button) return;
    
    const settings = extension_settings[Constants.EXTENSION_NAME];
    const iconType = settings.iconType || Constants.ICON_TYPES.ROCKET;
    
    // 清除按钮内容和样式
    button.innerHTML = '';
    button.className = 'interactable secondary-button';
    button.style.backgroundImage = '';
    button.style.backgroundSize = '';
    button.style.backgroundPosition = '';
    button.style.backgroundRepeat = '';
    
    // 根据图标类型设置内容
    if (iconType === Constants.ICON_TYPES.CUSTOM && settings.customIconUrl) {
        const customContent = settings.customIconUrl.trim();
        
        // 使用CSS背景图像显示
        if (customContent.startsWith('<svg') && customContent.includes('</svg>')) {
            // SVG代码 - 转换为Data URL
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(customContent);
            button.style.backgroundImage = `url('${svgDataUrl}')`;
            button.style.backgroundSize = '20px 20px';
            button.style.backgroundPosition = 'center';
            button.style.backgroundRepeat = 'no-repeat';
        } 
        else if (customContent.startsWith('data:') || 
                customContent.startsWith('http') || 
                customContent.endsWith('.png') || 
                customContent.endsWith('.jpg') || 
                customContent.endsWith('.svg') ||
                customContent.endsWith('.gif')) {
            // URL或完整的Data URL
            button.style.backgroundImage = `url('${customContent}')`;
            button.style.backgroundSize = '20px 20px';
            button.style.backgroundPosition = 'center';
            button.style.backgroundRepeat = 'no-repeat';
        } 
        else if (customContent.includes('base64,')) {
            // 不完整的base64，尝试补全
            let imgUrl = customContent;
            if (!customContent.startsWith('data:')) {
                imgUrl = 'data:image/png;base64,' + customContent.split('base64,')[1];
            }
            button.style.backgroundImage = `url('${imgUrl}')`;
            button.style.backgroundSize = '20px 20px';
            button.style.backgroundPosition = 'center';
            button.style.backgroundRepeat = 'no-repeat';
        } else {
            // 不是可识别的格式，使用文本显示
            button.textContent = '?';
            console.warn(`[${Constants.EXTENSION_NAME}] 无法识别的图标格式`);
        }
    } else {
        // 使用FontAwesome图标
        const iconClass = Constants.ICON_CLASS_MAP[iconType] || Constants.ICON_CLASS_MAP[Constants.ICON_TYPES.ROCKET];
        button.classList.add('fa-solid', iconClass);
    }
    
    // 应用颜色匹配设置
    if (settings.matchButtonColors) {
        // 从发送按钮获取CSS变量并应用到我们的按钮
        const sendButton = document.getElementById('send_but');
        if (sendButton) {
            // 获取计算后的样式
            const sendButtonStyle = getComputedStyle(sendButton);
            
            // 应用颜色
            button.style.color = sendButtonStyle.color;
            
            // 添加额外的CSS类以匹配发送按钮
            if (sendButton.classList.contains('primary-button')) {
                button.classList.remove('secondary-button');
                button.classList.add('primary-button');
            }
        }
    }
}

/**
 * Creates the HTML for the settings panel.
 * @returns {string} HTML string for the settings.
 */
export function createSettingsHtml() {
    // 菜单样式设置面板
    const stylePanel = `
    <div id="${Constants.ID_MENU_STYLE_PANEL}" style="display:none; position:fixed; left:50%; top:10%; transform:translateX(-50%); 
        z-index:1002; background-color:#0f0f0f; border:1px solid #444; border-radius:10px; padding:20px; width:500px; max-width:90vw;
        max-height:80vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
            <h3 style="margin:0">菜单样式设置</h3>
            <button class="menu_button" id="${Constants.ID_MENU_STYLE_PANEL}-close" style="padding:0 10px;">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
        
        <div class="quick-reply-style-group">
            <h4>菜单项样式</h4>
            <div class="quick-reply-settings-row">
                <label>菜单项背景:</label>
                <input type="color" id="qr-item-bgcolor-picker" class="qr-color-picker">
                <input type="range" id="qr-item-opacity" min="0" max="1" step="0.1" value="0.7" class="qr-opacity-slider">
                <span id="qr-item-opacity-value">0.7</span>
            </div>
            <div class="quick-reply-settings-row">
                <label>菜单项文字:</label>
                <input type="color" id="qr-item-color-picker" class="qr-color-picker">
            </div>
        </div>
        
        <div class="quick-reply-style-group">
            <h4>标题样式</h4>
            <div class="quick-reply-settings-row">
                <label>标题文字:</label>
                <input type="color" id="qr-title-color-picker" class="qr-color-picker">
            </div>
            <div class="quick-reply-settings-row">
                <label>分割线:</label>
                <input type="color" id="qr-title-border-picker" class="qr-color-picker">
            </div>
        </div>
        
        <div class="quick-reply-style-group">
            <h4>空提示样式</h4>
            <div class="quick-reply-settings-row">
                <label>提示文字:</label>
                <input type="color" id="qr-empty-color-picker" class="qr-color-picker">
            </div>
        </div>
        
        <div class="quick-reply-style-group">
            <h4>菜单面板样式</h4>
            <div class="quick-reply-settings-row">
                <label>菜单背景:</label>
                <input type="color" id="qr-menu-bgcolor-picker" class="qr-color-picker">
                <input type="range" id="qr-menu-opacity" min="0" max="1" step="0.1" value="0.85" class="qr-opacity-slider">
                <span id="qr-menu-opacity-value">0.85</span>
            </div>
            <div class="quick-reply-settings-row">
                <label>菜单边框:</label>
                <input type="color" id="qr-menu-border-picker" class="qr-color-picker">
            </div>
        </div>
        
        <div class="quick-reply-settings-row" style="margin-top:15px;">
            <label>
                <input type="checkbox" id="${Constants.ID_FOLLOW_THEME_CHECKBOX}"> 
                跟随主题样式
            </label>
        </div>
        
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
            <button class="menu_button" id="${Constants.ID_RESET_STYLE_BUTTON}">
                <i class="fa-solid fa-rotate-left"></i> 恢复默认
            </button>
            <button class="menu_button" id="${Constants.ID_MENU_STYLE_PANEL}-apply">
                <i class="fa-solid fa-check"></i> 应用样式
            </button>
        </div>
    </div>
    `;

    return `
    <div id="${Constants.ID_SETTINGS_CONTAINER}" class="extension-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>QR助手</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
            </div>
            <div class="inline-drawer-content">
                <p>此插件隐藏了原有的快捷回复栏，并创建了一个新的快速回复菜单。</p>
                <p>点击发送按钮旁边的图标可以打开或关闭菜单。</p>
                <div class="flex-container flexGap5">
                    <label for="${Constants.ID_SETTINGS_ENABLED_DROPDOWN}">插件状态:</label>
                    <select id="${Constants.ID_SETTINGS_ENABLED_DROPDOWN}" class="text_pole">
                        <option value="true">启用</option>
                        <option value="false">禁用</option>
                    </select>
                </div>
                
                <hr class="sysHR">
                <div class="${Constants.CLASS_SETTINGS_ROW}">
                    <label for="${Constants.ID_ICON_TYPE_DROPDOWN}">图标类型:</label>
                    <select id="${Constants.ID_ICON_TYPE_DROPDOWN}" class="text_pole">
                        <option value="${Constants.ICON_TYPES.ROCKET}">火箭图标</option>
                        <option value="${Constants.ICON_TYPES.COMMENT}">对话图标</option>
                        <option value="${Constants.ICON_TYPES.STAR}">星星图标</option>
                        <option value="${Constants.ICON_TYPES.BOLT}">闪电图标</option>
                        <option value="${Constants.ICON_TYPES.CUSTOM}">自定义图标</option>
                    </select>
                    <div class="${Constants.CLASS_ICON_PREVIEW}">
                        <i class="fa-solid fa-rocket"></i>
                    </div>
                </div>
                
                <div class="${Constants.CLASS_SETTINGS_ROW} custom-icon-container" style="display: none;">
                    <label for="${Constants.ID_CUSTOM_ICON_URL}">自定义图标:</label>
                    <div style="display:flex; flex-grow:1; gap:5px;">
                        <input type="text" id="${Constants.ID_CUSTOM_ICON_URL}" class="text_pole" style="flex-grow:1;"
                               placeholder="支持URL、base64编码图片或SVG代码" />
                        <input type="file" id="icon-file-upload" accept="image/*" style="display:none" />
                        <button class="menu_button" style="width:auto;padding:0 10px;" 
                                onclick="document.getElementById('icon-file-upload').click()">
                            选择文件
                        </button>
                    </div>
                </div>
                
                <div class="${Constants.CLASS_SETTINGS_ROW}">
                    <label>
                        <input type="checkbox" id="${Constants.ID_COLOR_MATCH_CHECKBOX}" />
                        使用与发送按钮相匹配的颜色风格
                    </label>
                </div>
                
                <div class="${Constants.CLASS_SETTINGS_ROW}" style="justify-content: flex-end; margin-top: 15px;">
                    <button id="${Constants.ID_MENU_STYLE_BUTTON}" class="menu_button" style="margin-right: 10px;">
                        <i class="fa-solid fa-palette"></i> 菜单样式
                    </button>
                    <button id="qr-save-settings" class="menu_button" onclick="window.quickReplyMenu.saveSettings()">
                        <i class="fa-solid fa-floppy-disk"></i> 保存设置
                    </button>
                </div>
                
                <hr class="sysHR">
                <div id="qr-save-status" style="text-align: center; color: #4caf50; height: 20px; margin-top: 5px;"></div>
            </div>
        </div>
    </div>${stylePanel}`;
}

/**
 * 更新图标预览 - 使用CSS背景图像
 * @param {string} iconType 图标类型
 */
function updateIconPreview(iconType) {
    const previewContainer = document.querySelector(`.${Constants.CLASS_ICON_PREVIEW}`);
    if (!previewContainer) return;
    
    // 清除内容和样式
    previewContainer.innerHTML = '';
    previewContainer.style.backgroundImage = '';
    previewContainer.style.backgroundSize = '';
    previewContainer.style.backgroundPosition = '';
    previewContainer.style.backgroundRepeat = '';
    
    if (iconType === Constants.ICON_TYPES.CUSTOM) {
        const customContent = extension_settings[Constants.EXTENSION_NAME].customIconUrl?.trim() || '';
        
        if (!customContent) {
            previewContainer.innerHTML = '<span>(无预览)</span>';
            return;
        }
        
        // 使用CSS背景图像显示
        if (customContent.startsWith('<svg') && customContent.includes('</svg>')) {
            // SVG代码 - 转换为Data URL
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(customContent);
            previewContainer.style.backgroundImage = `url('${svgDataUrl}')`;
            previewContainer.style.backgroundSize = '20px 20px';
            previewContainer.style.backgroundPosition = 'center';
            previewContainer.style.backgroundRepeat = 'no-repeat';
        } 
        else if (customContent.startsWith('data:') || 
                customContent.startsWith('http') || 
                customContent.endsWith('.png') || 
                customContent.endsWith('.jpg') || 
                customContent.endsWith('.svg') ||
                customContent.endsWith('.gif')) {
            // URL或完整的Data URL
            previewContainer.style.backgroundImage = `url('${customContent}')`;
            previewContainer.style.backgroundSize = '20px 20px';
            previewContainer.style.backgroundPosition = 'center';
            previewContainer.style.backgroundRepeat = 'no-repeat';
        } 
        else if (customContent.includes('base64,')) {
            // 不完整的base64，尝试补全
            let imgUrl = customContent;
            if (!customContent.startsWith('data:')) {
                imgUrl = 'data:image/png;base64,' + customContent.split('base64,')[1];
            }
            previewContainer.style.backgroundImage = `url('${imgUrl}')`;
            previewContainer.style.backgroundSize = '20px 20px';
            previewContainer.style.backgroundPosition = 'center';
            previewContainer.style.backgroundRepeat = 'no-repeat';
        } else {
            previewContainer.innerHTML = '<span>(格式不支持)</span>';
        }
    } else {
        const iconClass = Constants.ICON_CLASS_MAP[iconType] || Constants.ICON_CLASS_MAP[Constants.ICON_TYPES.ROCKET];
        previewContainer.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
    }
}

/**
 * 处理文件上传事件
 * @param {Event} event 文件上传事件
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const customIconUrl = document.getElementById(Constants.ID_CUSTOM_ICON_URL);
        if (customIconUrl) {
            customIconUrl.value = e.target.result; // 将文件转为base64
            
            // 更新设置
            const settings = extension_settings[Constants.EXTENSION_NAME];
            settings.customIconUrl = e.target.result;
            
            // 更新预览
            if (settings.iconType === Constants.ICON_TYPES.CUSTOM) {
                updateIconPreview(Constants.ICON_TYPES.CUSTOM);
            }
            
            // 更新图标显示
            updateIconDisplay();
            
            // 保存设置
            saveSettings();
        }
    };
    reader.readAsDataURL(file);
}

// 统一处理设置变更的函数
export function handleSettingsChange(event) {
    const target = event.target;
    const settings = extension_settings[Constants.EXTENSION_NAME];
    
    // 根据设置类型处理
    if (target.id === Constants.ID_SETTINGS_ENABLED_DROPDOWN) {
        const isEnabled = target.value === 'true';
        settings.enabled = isEnabled;
        
        if (sharedState.domElements.rocketButton) {
            sharedState.domElements.rocketButton.style.display = isEnabled ? '' : 'none';
        }
        if (!isEnabled) {
            setMenuVisible(false);
            updateMenuVisibilityUI();
        }
        console.log(`[${Constants.EXTENSION_NAME}] Enabled status set to: ${isEnabled}`);
    } 
    else if (target.id === Constants.ID_ICON_TYPE_DROPDOWN) {
        const iconType = target.value;
        settings.iconType = iconType;
        
        // 显示或隐藏自定义图标URL输入框
        const customIconContainer = document.querySelector('.custom-icon-container');
        if (customIconContainer) {
            customIconContainer.style.display = iconType === Constants.ICON_TYPES.CUSTOM ? 'flex' : 'none';
        }
        
        // 更新图标预览
        updateIconPreview(iconType);
    } 
    else if (target.id === Constants.ID_CUSTOM_ICON_URL) {
        const url = target.value;
        settings.customIconUrl = url;
        
        // 如果当前是自定义图标模式，更新预览
        if (settings.iconType === Constants.ICON_TYPES.CUSTOM) {
            updateIconPreview(Constants.ICON_TYPES.CUSTOM);
        }
    } 
    else if (target.id === Constants.ID_COLOR_MATCH_CHECKBOX) {
        const isMatched = target.checked;
        settings.matchButtonColors = isMatched;
    }
    else if (target.id === 'icon-file-upload') {
        // 文件上传由单独函数处理
        return;
    }
    
    // 更新图标显示
    updateIconDisplay();
    
    // 保存设置
    saveSettings();
}

// 保存设置
function saveSettings() {
    // 确保所有设置都已经更新到 extension_settings 对象
    const settings = extension_settings[Constants.EXTENSION_NAME];
    
    // 从 DOM 元素获取最新值
    const enabledDropdown = document.getElementById(Constants.ID_SETTINGS_ENABLED_DROPDOWN);
    const iconTypeDropdown = document.getElementById(Constants.ID_ICON_TYPE_DROPDOWN);
    const customIconUrl = document.getElementById(Constants.ID_CUSTOM_ICON_URL);
    const colorMatchCheckbox = document.getElementById(Constants.ID_COLOR_MATCH_CHECKBOX);
    
    if (enabledDropdown) settings.enabled = enabledDropdown.value === 'true';
    if (iconTypeDropdown) settings.iconType = iconTypeDropdown.value;
    if (customIconUrl) settings.customIconUrl = customIconUrl.value;
    if (colorMatchCheckbox) settings.matchButtonColors = colorMatchCheckbox.checked;
    
    // 保存设置
    if (typeof context !== 'undefined' && context.saveExtensionSettings) {
        try {
            context.saveExtensionSettings();
            console.log(`[${Constants.EXTENSION_NAME}] 设置已保存成功`);
            return true;
        } catch (error) {
            console.error(`[${Constants.EXTENSION_NAME}] 保存设置失败:`, error);
            return false;
        }
    } else {
        // 模拟保存
        console.log(`[${Constants.EXTENSION_NAME}] 设置已更新（模拟保存）`);
        localStorage.setItem(`${Constants.EXTENSION_NAME}_settings`, JSON.stringify(settings));
        return true;
    }
}

/**
 * 设置事件监听器
 */
export function setupSettingsEventListeners() {
    // 文件上传监听器
    const fileUpload = document.getElementById('icon-file-upload');
    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileUpload);
    }
    
    // 添加保存按钮监听器
    const saveButton = document.getElementById('qr-save-settings');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            saveSettings();
            // 显示保存成功提示
            const settings = extension_settings[Constants.EXTENSION_NAME];
            // 更新图标预览和显示
            if (settings.iconType === Constants.ICON_TYPES.CUSTOM) {
                updateIconPreview(Constants.ICON_TYPES.CUSTOM);
            }
            updateIconDisplay();
            
            // 更新菜单样式
            if (typeof updateMenuStylesUI === 'function') {
                updateMenuStylesUI();
            }
            
            // 显示保存成功的临时提示
            saveButton.innerHTML = '<i class="fa-solid fa-check"></i> 已保存';
            saveButton.style.backgroundColor = '#4caf50';
            setTimeout(() => {
                saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 保存设置';
                saveButton.style.backgroundColor = '';
            }, 2000);
        });
    }
}

/**
 * Loads initial settings and applies them.
 */
export function loadAndApplySettings() {
    // 确保设置对象存在并设置默认值
    const settings = extension_settings[Constants.EXTENSION_NAME] = extension_settings[Constants.EXTENSION_NAME] || {};
    
    // 设置默认值
    settings.enabled = settings.enabled !== false; // 默认启用
    settings.iconType = settings.iconType || Constants.ICON_TYPES.ROCKET; // 默认火箭图标
    settings.customIconUrl = settings.customIconUrl || ''; // 默认空URL
    settings.matchButtonColors = settings.matchButtonColors !== false; // 默认匹配颜色

    // 应用设置到UI元素
    const dropdown = sharedState.domElements.settingsDropdown;
    if (dropdown) {
        dropdown.value = String(settings.enabled);
    }
    
    // 设置图标类型下拉框
    const iconTypeDropdown = document.getElementById(Constants.ID_ICON_TYPE_DROPDOWN);
    if (iconTypeDropdown) {
        iconTypeDropdown.value = settings.iconType;
        
        // 显示或隐藏自定义图标URL输入框
        const customIconContainer = document.querySelector('.custom-icon-container');
        if (customIconContainer) {
            customIconContainer.style.display = settings.iconType === Constants.ICON_TYPES.CUSTOM ? 'flex' : 'none';
        }
    }
    
    // 设置自定义图标URL
    const customIconUrl = document.getElementById(Constants.ID_CUSTOM_ICON_URL);
    if (customIconUrl) {
        customIconUrl.value = settings.customIconUrl;
    }
    
    // 设置颜色匹配复选框
    const colorMatchCheckbox = document.getElementById(Constants.ID_COLOR_MATCH_CHECKBOX);
    if (colorMatchCheckbox) {
        colorMatchCheckbox.checked = settings.matchButtonColors;
    }
    
    // 设置文件上传事件监听器
    setupSettingsEventListeners();
    
    // 更新图标预览
    updateIconPreview(settings.iconType);
    
    // 如果禁用则隐藏按钮
    if (!settings.enabled && sharedState.domElements.rocketButton) {
        sharedState.domElements.rocketButton.style.display = 'none';
    }

    // 更新图标显示
    updateIconDisplay();
    
    // 应用菜单样式
    if (typeof updateMenuStylesUI === 'function' && settings.menuStyles) {
        updateMenuStylesUI();
    } else if (!settings.menuStyles) {
        // 如果没有样式设置，则创建默认值
        settings.menuStyles = JSON.parse(JSON.stringify(Constants.DEFAULT_MENU_STYLES));
    }

    console.log(`[${Constants.EXTENSION_NAME}] Settings loaded and applied.`);
}
