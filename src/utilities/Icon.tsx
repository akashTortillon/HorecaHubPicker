import React from 'react';
import { SvgXml } from 'react-native-svg';

interface IconProps {
  xml: any; // The raw SVG string from your file
  size?: number; // Diameter of the icon
  color?: string; // Fill/Stroke color (replaces 'currentColor')
  strokeWidth?: number; // Adjust thickness
  fill?: string;
}

const Icon = ({
  xml,
  size = 24,
  color = 'white',
  strokeWidth,
  fill = 'none',
}: IconProps) => {
  // We use regex to optionally replace the stroke-width if you want to customize it
  let processedXml = xml;

  if (strokeWidth) {
    processedXml = xml.replace(
      /stroke-width=".*?"/g,
      `stroke-width="${strokeWidth}"`,
    );
  }

  return (
    <SvgXml
      xml={processedXml}
      width={size}
      height={size}
      color={color}
      fill={fill}
    />
  );
};

export default Icon;
