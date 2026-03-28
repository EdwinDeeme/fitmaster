import React from 'react';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

interface Props {
  size?: number;
}

export function FitMasterLogo({ size = 100 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Green neon circle */}
      <Circle cx="50" cy="50" r="50" fill="#C1EF00" />
      {/* FM text in dark */}
      <SvgText
        x="50"
        y="63"
        textAnchor="middle"
        fontSize="40"
        fontWeight="900"
        fill="#212121"
        fontFamily="System"
      >
        FM
      </SvgText>
    </Svg>
  );
}
