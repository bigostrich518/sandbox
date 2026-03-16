import { useBracketStore } from './store/useBracketStore';
import WizardView from './components/WizardView';
import TeamModal from './components/TeamModal';

function App() {
  const selectedTeam = useBracketStore(state => state.selectedTeam);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-sans">
      <header className="fixed top-0 w-full z-50 glass-panel-active rounded-none border-x-0 border-t-0 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-[#f97316]">
            Madness <span className="text-white">Architect</span>
          </h1>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium tracking-wide text-slate-300">
            <button className="hover:text-white transition-colors">Bracket</button>
            <button className="hover:text-white transition-colors">Leaderboard</button>
            <button className="hover:text-white transition-colors text-emerald-400">Save Picks</button>
          </nav>
        </div>
      </header>

      <main className="pt-24 min-h-screen w-full flex overflow-y-auto">
        <WizardView onInfoClick={(team) => useBracketStore.getState().setSelectedTeam(team)} />
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}} />

      {selectedTeam && (
        <TeamModal
          team={selectedTeam}
          onClose={() => useBracketStore.getState().setSelectedTeam(null)}
        />
      )}
    </div>
  );
}

export default App;
