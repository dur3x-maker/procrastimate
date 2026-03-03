import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SelfReportPanel } from '../SelfReportPanel';
import { useStats } from '@/hooks/useStats';

jest.mock('@/hooks/useStats');
const mockUseStats = useStats as jest.MockedFunction<typeof useStats>;

describe('SelfReportPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('mode="self"', () => {
    it('renders all metrics for self mode', async () => {
      mockUseStats.mockReturnValue({
        data: {
          total_focus_minutes: 120,
          total_break_minutes: 30,
          total_sessions: 3,
          total_completed_tasks: 5,
          streak: 7,
        },
        loading: false,
        error: null,
        setRange: jest.fn(),
      });

      localStorage.setItem('pm_funengineOpensToday', '2');
      localStorage.setItem('pm_resistedDistractionsToday', '4');
      localStorage.setItem('pm_skippedBreaksToday', '1');

      render(<SelfReportPanel mode="self" />);

      await waitFor(() => {
        expect(screen.getByText('2:00')).toBeInTheDocument();
        expect(screen.getByText('0:30')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('shows commentary when resisted distractions > 0', async () => {
      mockUseStats.mockReturnValue({
        data: {
          total_focus_minutes: 60,
          total_break_minutes: 10,
          total_sessions: 1,
          total_completed_tasks: 2,
          streak: 1,
        },
        loading: false,
        error: null,
        setRange: jest.fn(),
      });

      localStorage.setItem('pm_resistedDistractionsToday', '3');

      render(<SelfReportPanel mode="self" />);

      await waitFor(() => {
        expect(screen.getByText(/You resisted distraction 3 times today/)).toBeInTheDocument();
      });
    });

    it('shows commentary when funengine opens > 0', async () => {
      mockUseStats.mockReturnValue({
        data: {
          total_focus_minutes: 60,
          total_break_minutes: 10,
          total_sessions: 1,
          total_completed_tasks: 2,
          streak: 1,
        },
        loading: false,
        error: null,
        setRange: jest.fn(),
      });

      localStorage.setItem('pm_funengineOpensToday', '2');

      render(<SelfReportPanel mode="self" />);

      await waitFor(() => {
        expect(screen.getByText(/You allowed yourself to reset 2 times/)).toBeInTheDocument();
      });
    });

    it('uses singular form for count of 1', async () => {
      mockUseStats.mockReturnValue({
        data: {
          total_focus_minutes: 60,
          total_break_minutes: 10,
          total_sessions: 1,
          total_completed_tasks: 2,
          streak: 1,
        },
        loading: false,
        error: null,
        setRange: jest.fn(),
      });

      localStorage.setItem('pm_resistedDistractionsToday', '1');
      localStorage.setItem('pm_funengineOpensToday', '1');

      render(<SelfReportPanel mode="self" />);

      await waitFor(() => {
        expect(screen.getByText(/You resisted distraction 1 time today/)).toBeInTheDocument();
        expect(screen.getByText(/You allowed yourself to reset 1 time/)).toBeInTheDocument();
      });
    });
  });

  describe('mode="employer"', () => {
    it('renders only work metrics for employer mode', async () => {
      mockUseStats.mockReturnValue({
        data: {
          total_focus_minutes: 120,
          total_break_minutes: 30,
          total_sessions: 3,
          total_completed_tasks: 5,
          streak: 7,
        },
        loading: false,
        error: null,
        setRange: jest.fn(),
      });

      localStorage.setItem('pm_funengineOpensToday', '2');
      localStorage.setItem('pm_resistedDistractionsToday', '4');
      localStorage.setItem('pm_skippedBreaksToday', '1');

      render(<SelfReportPanel mode="employer" />);

      await waitFor(() => {
        expect(screen.getByText('2:00')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });

      expect(screen.queryByText('0:30')).not.toBeInTheDocument();
      expect(screen.queryByText('7')).not.toBeInTheDocument();
      expect(screen.queryByText(/resisted distraction/)).not.toBeInTheDocument();
      expect(screen.queryByText(/allowed yourself to reset/)).not.toBeInTheDocument();
    });

    it('does not show commentary in employer mode', async () => {
      mockUseStats.mockReturnValue({
        data: {
          total_focus_minutes: 60,
          total_break_minutes: 10,
          total_sessions: 1,
          total_completed_tasks: 2,
          streak: 1,
        },
        loading: false,
        error: null,
        setRange: jest.fn(),
      });

      localStorage.setItem('pm_resistedDistractionsToday', '5');
      localStorage.setItem('pm_funengineOpensToday', '3');

      render(<SelfReportPanel mode="employer" />);

      await waitFor(() => {
        expect(screen.queryByText(/resisted/)).not.toBeInTheDocument();
        expect(screen.queryByText(/reset/)).not.toBeInTheDocument();
      });
    });
  });

  describe('time formatting', () => {
    it('formats hours and minutes correctly', async () => {
      mockUseStats.mockReturnValue({
        data: {
          total_focus_minutes: 185,
          total_break_minutes: 0,
          total_sessions: 1,
          total_completed_tasks: 1,
          streak: 1,
        },
        loading: false,
        error: null,
        setRange: jest.fn(),
      });

      render(<SelfReportPanel mode="self" />);

      await waitFor(() => {
        expect(screen.getByText('3:05')).toBeInTheDocument();
      });
    });

    it('pads minutes with zero', async () => {
      mockUseStats.mockReturnValue({
        data: {
          total_focus_minutes: 65,
          total_break_minutes: 0,
          total_sessions: 1,
          total_completed_tasks: 1,
          streak: 1,
        },
        loading: false,
        error: null,
        setRange: jest.fn(),
      });

      render(<SelfReportPanel mode="self" />);

      await waitFor(() => {
        expect(screen.getByText('1:05')).toBeInTheDocument();
      });
    });
  });

  describe('loading and error states', () => {
    it('shows loading state', () => {
      mockUseStats.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        setRange: jest.fn(),
      });

      render(<SelfReportPanel mode="self" />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      mockUseStats.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to load',
        setRange: jest.fn(),
      });

      render(<SelfReportPanel mode="self" />);

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  describe('localStorage handling', () => {
    it('handles empty localStorage', async () => {
      mockUseStats.mockReturnValue({
        data: {
          total_focus_minutes: 60,
          total_break_minutes: 10,
          total_sessions: 1,
          total_completed_tasks: 1,
          streak: 1,
        },
        loading: false,
        error: null,
        setRange: jest.fn(),
      });

      render(<SelfReportPanel mode="self" />);

      await waitFor(() => {
        const elements = screen.getAllByText('0');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('handles invalid localStorage values', async () => {
      mockUseStats.mockReturnValue({
        data: {
          total_focus_minutes: 60,
          total_break_minutes: 10,
          total_sessions: 1,
          total_completed_tasks: 1,
          streak: 1,
        },
        loading: false,
        error: null,
        setRange: jest.fn(),
      });

      localStorage.setItem('pm_funengineOpensToday', 'invalid');
      localStorage.setItem('pm_resistedDistractionsToday', '');
      localStorage.setItem('pm_skippedBreaksToday', 'NaN');

      render(<SelfReportPanel mode="self" />);

      await waitFor(() => {
        const elements = screen.getAllByText('0');
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SSR safety', () => {
    it('readLocalStorageNumber returns 0 when window is undefined', () => {
      mockUseStats.mockReturnValue({
        data: {
          total_focus_minutes: 60,
          total_break_minutes: 10,
          total_sessions: 1,
          total_completed_tasks: 1,
          streak: 1,
        },
        loading: false,
        error: null,
        setRange: jest.fn(),
      });

      render(<SelfReportPanel mode="self" />);

      expect(screen.getByText('1:00')).toBeInTheDocument();
    });
  });
});
