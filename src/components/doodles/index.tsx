import { Fork, Spoon, Star, WaveRight, Zap } from '@doodle-icons/react-native';
import type { ComponentType } from 'react';
import { View } from 'react-native';

interface DoodleProps {
  size?: number;
  color: string;
  rotation?: number;
  opacity?: number;
}

type IconProps = { size?: number | string; color?: string; style?: object };

function IconDoodle({ icon: Icon, size = 28, color, rotation = 0, opacity = 1 }: DoodleProps & { icon: ComponentType<IconProps> }) {
  return <Icon size={size} color={color} style={{ transform: [{ rotate: `${rotation}deg` }], opacity }} />;
}

export function DoodleStar(props: DoodleProps) { return <IconDoodle icon={Star} {...props} />; }
export function DoodleSpark(props: DoodleProps) { return <IconDoodle icon={Zap} {...props} />; }
export function DoodleSwirl(props: DoodleProps) { return <IconDoodle icon={WaveRight} {...props} />; }

export function DoodleBurst({ size = 72, color, rotation = 0, opacity = 1 }: DoodleProps) {
  return <View style={{ width: size, height: size, transform: [{ rotate: `${rotation}deg` }], opacity }}>
    <View style={{ position: 'absolute', left: size * 0.04, top: size * 0.1 }}><DoodleStar size={size * 0.62} color={color} /></View>
    <View style={{ position: 'absolute', right: 0, bottom: 0 }}><DoodleSpark size={size * 0.4} color={color} rotation={18} /></View>
  </View>;
}

export function DoodleFoodAccent({ size = 44, color, rotation = 0, opacity = 1 }: DoodleProps) {
  return <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'center', transform: [{ rotate: `${rotation}deg` }], opacity }}>
    <Fork size={size * 0.52} color={color} />
    <Spoon size={size * 0.52} color={color} />
  </View>;
}
