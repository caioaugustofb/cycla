import { createContext, useContext, type ComponentProps } from "react";
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type TextStyle,
} from "react-native";
import { cssInterop } from "nativewind";
import { BODY_FONT, SERIF_MARKER, resolveFontFamily } from "@/lib/fonts";

const InsideText = createContext(false);

function Text({ style, ...rest }: ComponentProps<typeof RNText>) {
  const insideText = useContext(InsideText);
  const { fontWeight, fontFamily, ...others } = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const serif = fontFamily === SERIF_MARKER;

  // Família customizada explícita: respeita como veio.
  if (fontFamily && !serif) {
    return (
      <InsideText.Provider value>
        <RNText {...rest} style={style} />
      </InsideText.Provider>
    );
  }

  // Texto aninhado sem peso próprio herda a fonte do pai, como no RN puro.
  const inherits = insideText && fontWeight == null && fontFamily == null;

  return (
    <InsideText.Provider value>
      <RNText
        {...rest}
        style={[others, !inherits && { fontFamily: resolveFontFamily(fontWeight, serif) }]}
      />
    </InsideText.Provider>
  );
}

function TextInput({ style, ...rest }: ComponentProps<typeof RNTextInput>) {
  return <RNTextInput {...rest} style={[{ fontFamily: BODY_FONT }, style]} />;
}

cssInterop(Text, { className: "style" });
cssInterop(TextInput, { className: "style" });

export { Text, TextInput };
