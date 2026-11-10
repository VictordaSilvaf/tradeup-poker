import { Component, useEffect } from 'react';
import type { ReactNode } from 'react';
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from '../presentation/pages/home-page';
import { RoomPage } from '../presentation/pages/room-page';
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="not-found">
          <h1>Precisamos reorganizar a mesa.</h1>
          <p>Ocorreu um erro inesperado. Recarregue a página para tentar novamente.</p>
          <button className="button button-primary" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </main>
      );
    return this.props.children;
  }
}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sala/:roomId" element={<RoomPage />} />
          <Route
            path="*"
            element={
              <main className="not-found">
                <h1>Esse caminho não leva a uma mesa.</h1>
                <Link to="/" className="button button-primary">
                  Voltar ao início
                </Link>
              </main>
            }
          />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
