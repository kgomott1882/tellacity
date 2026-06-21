/** Dashboard widget gallery card, iframe viewport (matches Review List thumb). */
export const WIDGET_GALLERY_CANVAS_WIDTH = 420;
export const WIDGET_GALLERY_CANVAS_HEIGHT = 440;

export const WIDGET_GALLERY_PANE_HEIGHT = 460;
export const WIDGET_GALLERY_CARD_WIDTH = 426;

export const WIDGET_GALLERY_DISPLAY_SCALE = Math.min(
  (WIDGET_GALLERY_PANE_HEIGHT - 24) / WIDGET_GALLERY_CANVAS_HEIGHT,
  (WIDGET_GALLERY_CARD_WIDTH - 24) / WIDGET_GALLERY_CANVAS_WIDTH,
);
