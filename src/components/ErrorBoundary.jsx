import React from "react";
import Error from "./Error"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Xatolik ushlanib olindi:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Error type="error" message="Nimadadir xatolik yuz berdi 😵" />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
