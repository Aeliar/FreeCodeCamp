import { handleActions } from 'redux-actions';
import { createPoly } from '../../../../utils/polyvinyl';

import types from './types';
import { bonfire, html, js } from '../../../utils/challengeTypes';
import {
  arrayToString,
  buildSeed,
  createTests,
  getPreFile,
  getFileKey
} from '../utils';

const initialState = {
  id: '',
  challenge: '',
  legacyKey: '',
  currentStep: 0,
  previousStep: -1,
  filter: '',
  files: {},
  superBlocks: [],
  toast: 0
};

const mainReducer = handleActions(
  {
    [types.fetchChallengeCompleted]: (state, { payload = '' }) => ({
      ...state,
      challenge: payload
    }),
    [types.updateCurrentChallenge]: (state, { payload: challenge }) => ({
      ...state,
      id: challenge.id,
      // used mainly to find code storage
      legacyKey: challenge.name,
      challenge: challenge.dashedName,
      key: getFileKey(challenge),
      tests: createTests(challenge)
    }),
    [types.updateTests]: (state, { payload: tests }) => ({
      ...state,
      tests
    }),
    [types.executeChallenge]: state => ({
      ...state,
      tests: state.tests.map(test => ({ ...test, err: false, pass: false }))
    }),
    [types.showChallengeComplete]: (state, { payload: toast }) => ({
      ...state,
      toast
    }),
    [types.showProjectSubmit]: state => ({
      ...state,
      isSubmitting: true
    }),

    // map
    [types.updateFilter]: (state, { payload = ''}) => ({
      ...state,
      filter: payload
    }),
    [types.clearFilter]: (state) => ({
      ...state,
      filter: ''
    }),
    [types.fetchChallengesCompleted]: (state, { payload = [] }) => ({
      ...state,
      superBlocks: payload
    }),

    // step
    [types.resetStep]: () => initialState,
    [types.goToStep]: (state, { payload: step = 0 }) => ({
      ...state,
      currentStep: step,
      previousStep: state.currentStep
    }),
    [types.initOutput]: (state, { payload: output }) => ({
      ...state,
      output
    }),
    [types.updateOutput]: (state, { payload: output }) => ({
      ...state,
      output: (state.output || '') + output
    })
  },
  initialState
);

const filesReducer = handleActions(
  {
    [types.updateFile]: (state, { payload: file }) => ({
      ...state,
      [file.key]: file
    }),
    [types.updateFiles]: (state, { payload: files }) => {
      return files
        .reduce((files, file) => {
          files[file.key] = file;
          return files;
        }, { ...state });
    },
    [types.savedCodeFound]: (state, { payload: files }) => ({
      ...files
    }),
    [types.updateCurrentChallenge]: (state, { payload: challenge }) => {
      if (challenge.type === 'mod') {
        return challenge.files;
      }
      if (
        challenge.challengeType !== html &&
        challenge.challengeType !== js &&
        challenge.challengeType !== bonfire
      ) {
        return {};
      }
      const preFile = getPreFile(challenge);
      return {
        ...state,
        [preFile.key]: createPoly({
          ...preFile,
          contents: buildSeed(challenge),
          head: arrayToString(challenge.head),
          tail: arrayToString(challenge.tail)
        })
      };
    }
  },
  {}
);

export default function challengeReducers(state, action) {
  const newState = mainReducer(state, action);
  const files = filesReducer(state && state.files || {}, action);
  return newState.files !== files ? { ...newState, files } : newState;
}