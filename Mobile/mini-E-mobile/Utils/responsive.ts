import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device (e.g. iPhone 11 Pro/14 Pro width)
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

/**
 * Converts width percentage to DP.
 * @param widthPercent - Percentage of screen's width (e.g., '50%', or 50)
 */
export const widthPercentageToDP = (widthPercent: string | number): number => {
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};
export const wp = widthPercentageToDP;

/**
 * Converts height percentage to DP.
 * @param heightPercent - Percentage of screen's height (e.g., '50%', or 50)
 */
export const heightPercentageToDP = (heightPercent: string | number): number => {
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};
export const hp = heightPercentageToDP;

/**
 * Scales a size up/down based on screen width relative to guideline width.
 * Useful for fonts, padding, margins, etc.
 * @param size - Base size to scale
 */
export const scale = (size: number): number => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scales a size based on screen height relative to guideline height.
 * @param size - Base size to scale
 */
export const verticalScale = (size: number): number => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderately scales a size. Takes a factor to control how much it scales.
 * Useful for responsive padding/margin that shouldn't grow linearly on tablets.
 * @param size - Base size
 * @param factor - Factor to control scaling (default 0.5)
 */
export const moderateScale = (size: number, factor: number = 0.5): number =>
  size + (scale(size) - size) * factor;

/**
 * Get dynamic responsive width for a grid item, ensuring it respects max width on tablets.
 * @param currentWidth - Provide current screen width (e.g., from useWindowDimensions)
 * @param paddingTotal - Total horizontal padding space
 * @param gap - Gap between items
 * @param numColumns - Number of columns
 */
export const getGridItemWidth = (
  currentWidth: number,
  paddingTotal: number,
  gap: number,
  numColumns: number = 2
) => {
  const availableWidth = currentWidth - paddingTotal - (gap * (numColumns - 1));
  return availableWidth / numColumns;
};
