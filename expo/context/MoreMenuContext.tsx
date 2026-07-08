import { createContext, useContext, useState } from 'react';

type MoreMenuContextValue = {
  visible: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
};

const MoreMenuContext = createContext<MoreMenuContextValue>({
  visible: false,
  show: () => {},
  hide: () => {},
  toggle: () => {},
});

export function MoreMenuProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const show = () => setVisible(true);
  const hide = () => setVisible(false);
  const toggle = () => setVisible((v) => !v);
  return (
    <MoreMenuContext.Provider value={{ visible, show, hide, toggle }}>
      {children}
    </MoreMenuContext.Provider>
  );
}

export function useMoreMenu() {
  return useContext(MoreMenuContext);
}
