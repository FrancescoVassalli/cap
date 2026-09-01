import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';
import { colors, layout } from '@/theme';

type ScreenProps = PropsWithChildren<{
  edges?: Edge[];
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({
  children,
  edges = ['top', 'bottom'],
  padded = true,
  style,
}: ScreenProps) {
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, padded && styles.padded, style]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.semantic.background,
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
  },
});