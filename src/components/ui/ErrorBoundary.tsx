import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";

type Props = { children: ReactNode; label?: string };

type State = { err: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[ErrorBoundary]", error.message, info.componentStack);
    }
  }

  render() {
    if (this.state.err) {
      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#0A0A0F" }}>
          <Text style={{ color: "#F0F0FF", fontFamily: "SpaceGrotesk_700Bold", fontSize: 20 }}>Something went wrong</Text>
          <Text style={{ color: "#8888AA", marginTop: 10 }}>
            {this.props.label ? `${this.props.label} couldn’t load.` : "This screen hit an unexpected error."}
          </Text>
          <View style={{ marginTop: 24 }}>
            <Button title="Try again" onPress={() => this.setState({ err: null })} />
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}
