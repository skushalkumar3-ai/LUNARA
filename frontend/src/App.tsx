
import { useCallback, useState } from "react";

import LaunchSequence from "./launch/LaunchSequence";
import SurfaceTutorial from "./tutorial/SurfaceTutorial";

function App() {
  const [launchComplete, setLaunchComplete] = useState(false);
  const handleLaunchComplete = useCallback(() => setLaunchComplete(true), []);

  return launchComplete ? (
    <SurfaceTutorial />
  ) : (
    <LaunchSequence onComplete={handleLaunchComplete} />
  );
}

export default App;
