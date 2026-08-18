import latest_gui_title_minecraft from 'mc-assets/dist/other-textures/latest/gui/title/minecraft.png'
import other_textures_1_19_gui_icons from 'mc-assets/dist/other-textures/1.19/gui/icons.png'
import other_textures_latest_gui_widgets from 'mc-assets/dist/other-textures/latest/gui/widgets.png'
import other_textures_latest_gui_bars from 'mc-assets/dist/other-textures/latest/gui/bars.png'

export const appReplacableResources: { [key in Keys]: { content: any, resourcePackPath: string, cssVar?: string, cssVarRepeat?: number } } = {

  'latest_gui_title_minecraft': {
    content: latest_gui_title_minecraft,
    resourcePackPath: 'minecraft/textures/gui/title/minecraft.png',
    ...{"cssVar":"--title-gui"}
  },

  'other_textures_1_19_gui_icons': {
    content: other_textures_1_19_gui_icons,
    resourcePackPath: 'minecraft/textures/gui/icons.png',
    ...{"cssVar":"--gui-icons","cssVarRepeat":2}
  },

  'other_textures_latest_gui_widgets': {
    content: other_textures_latest_gui_widgets,
    resourcePackPath: 'minecraft/textures/gui/widgets.png',
    ...{"cssVar":"--widgets-gui-atlas"}
  },

  'other_textures_latest_gui_bars': {
    content: other_textures_latest_gui_bars,
    resourcePackPath: 'minecraft/textures/gui/bars.png',
    ...{"cssVar":"--bars-gui-atlas"}
  },
}
type Keys = 'latest_gui_title_minecraft' | 'other_textures_1_19_gui_icons' | 'other_textures_latest_gui_widgets' | 'other_textures_latest_gui_bars'
export const resourcesContentOriginal = {

  'latest_gui_title_minecraft': latest_gui_title_minecraft,

  'other_textures_1_19_gui_icons': other_textures_1_19_gui_icons,

  'other_textures_latest_gui_widgets': other_textures_latest_gui_widgets,

  'other_textures_latest_gui_bars': other_textures_latest_gui_bars,
}
