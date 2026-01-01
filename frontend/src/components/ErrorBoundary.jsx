class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. <button onClick={() => window.location.reload()}>Reload</button></div>;
    }
    return this.props.children;
  }
}