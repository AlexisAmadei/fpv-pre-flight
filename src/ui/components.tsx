import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { TextInputProps, ViewProps } from 'react-native';

/*
 * Shared primitives for the Pre-Flight look: square corners, hairline borders,
 * no shadows, uppercase letter-spaced meta labels. Screens compose these rather
 * than re-deriving the same className strings, so a token change lands once.
 */

/** Small uppercase tracked label — the design's section/meta heading. */
export function MetaLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-[10px] uppercase tracking-[1.5px] text-muted-foreground ${className}`}
    >
      {children}
    </Text>
  );
}

export function SectionTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-[11px] font-bold uppercase tracking-[1.6px] text-muted-foreground ${className}`}
    >
      {children}
    </Text>
  );
}

/** Monospace numeric/coordinate text, tabular so columns line up. */
export function Mono({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text className={`font-mono text-[11px] tabular-nums ${className}`}>
      {children}
    </Text>
  );
}

export function Card({ className = '', children, ...rest }: ViewProps) {
  return (
    <View className={`border border-border bg-card ${className}`} {...rest}>
      {children}
    </View>
  );
}

type ButtonVariant = 'primary' | 'outline' | 'destructive';

export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'md',
  testID,
  className = '',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  testID?: string;
  className?: string;
}) {
  const surface = {
    primary: 'bg-primary border-primary',
    outline: 'bg-background border-border',
    destructive: 'bg-destructive border-destructive',
  }[variant];

  const text = {
    primary: 'text-primary-foreground',
    outline: 'text-foreground',
    destructive: 'text-destructive-foreground',
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      className={`items-center justify-center border ${surface} ${
        size === 'sm' ? 'px-3 py-2' : 'px-4 py-3.5'
      } ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      <Text
        className={`font-semibold ${text} ${
          size === 'sm' ? 'text-[12px]' : 'text-[14px]'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Compact bordered control used for header actions and inline toggles. */
export function ChipButton({
  label,
  onPress,
  disabled = false,
  selected = false,
  testID,
  className = '',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  testID?: string;
  className?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      className={`border px-2.5 py-1.5 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-background'
      } ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      <Text
        className={`font-mono text-[10px] uppercase tracking-[1px] ${
          selected ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  className = '',
  ...rest
}: TextInputProps & { label?: string }) {
  return (
    <View className={className}>
      {label ? <MetaLabel className="mb-1.5">{label}</MetaLabel> : null}
      <TextInput
        className="border border-input bg-card px-3 py-2.5 text-[14px] text-foreground"
        placeholderTextColor="rgb(var(--muted-foreground))"
        {...rest}
      />
    </View>
  );
}

/** Full-width hairline used to separate the header from content. */
export function Divider({ className = '' }: { className?: string }) {
  return <View className={`h-px bg-border ${className}`} />;
}

export function EmptyState({
  message,
  children,
}: {
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="items-center gap-3 px-8 py-14">
      <Text className="text-center text-[13px] leading-5 text-muted-foreground">
        {message}
      </Text>
      {children}
    </View>
  );
}
