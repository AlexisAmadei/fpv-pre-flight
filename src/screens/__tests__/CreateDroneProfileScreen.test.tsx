import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { CreateDroneProfileScreen } from '../CreateDroneProfileScreen';
import { addDroneProfile } from '../../droneProfiles/droneProfileRepository';
import { flush } from '../../testUtils/flush';

jest.mock('../../droneProfiles/droneProfileRepository', () => ({
  addDroneProfile: jest.fn().mockResolvedValue(undefined),
}));

const mockAddDroneProfile = addDroneProfile as jest.MockedFunction<
  typeof addDroneProfile
>;

beforeEach(() => {
  mockAddDroneProfile.mockReset().mockResolvedValue(undefined);
});

async function render(onCreated = jest.fn()) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <CreateDroneProfileScreen onCreated={onCreated} />,
    );
  });
  await flush();
  return renderer;
}

describe('CreateDroneProfileScreen', () => {
  it('shows no WeightClass options until a DroneKind is chosen', async () => {
    const renderer = await render();

    expect(
      renderer.root.findAll(
        node =>
          typeof node.props.testID === 'string' &&
          node.props.testID.startsWith('weight-class-'),
      ),
    ).toHaveLength(0);
    expect(
      renderer.root.findByProps({ testID: 'save-drone-profile' }).props
        .disabled,
    ).toBe(true);
  });

  it('reveals the existing FPV WeightClass row unchanged when FPV is chosen', async () => {
    const renderer = await render();

    act(() => {
      renderer.root.findByProps({ testID: 'kind-fpv' }).props.onPress();
    });

    expect(renderer.root.findByProps({ testID: 'weight-class-5-inch' })).toBeTruthy();
    expect(() =>
      renderer.root.findByProps({ testID: 'weight-class-sub-250g' }),
    ).toThrow();
  });

  it('shows the DJI model picker grouped by product line, plus a manual fallback, when camera is chosen', async () => {
    const renderer = await render();

    act(() => {
      renderer.root.findByProps({ testID: 'kind-camera' }).props.onPress();
    });

    expect(renderer.root.findByProps({ testID: 'drone-model-dji-neo' })).toBeTruthy();
    expect(
      renderer.root.findByProps({ testID: 'drone-model-dji-mini-4-pro' }),
    ).toBeTruthy();
    expect(
      renderer.root.findByProps({ testID: 'drone-model-dji-mini-5-pro' }),
    ).toBeTruthy();
    expect(renderer.root.findByProps({ testID: 'drone-model-dji-air-3s' })).toBeTruthy();
    expect(
      renderer.root.findByProps({ testID: 'drone-model-dji-mavic-3-pro' }),
    ).toBeTruthy();
    expect(
      renderer.root.findByProps({ testID: 'drone-model-dji-mavic-4-pro' }),
    ).toBeTruthy();
    expect(
      renderer.root.findByProps({ testID: 'choose-weight-class-manually' }),
    ).toBeTruthy();
    // The manual bracket picker itself is not shown until that fallback is chosen.
    expect(() =>
      renderer.root.findByProps({ testID: 'weight-class-sub-250g' }),
    ).toThrow();
  });

  it('reveals camera WeightClass brackets after choosing to pick manually', async () => {
    const renderer = await render();

    act(() => {
      renderer.root.findByProps({ testID: 'kind-camera' }).props.onPress();
    });
    act(() => {
      renderer.root
        .findByProps({ testID: 'choose-weight-class-manually' })
        .props.onPress();
    });

    expect(
      renderer.root.findByProps({ testID: 'weight-class-sub-250g' }),
    ).toBeTruthy();
    expect(
      renderer.root.findByProps({ testID: 'weight-class-250g-900g' }),
    ).toBeTruthy();
    expect(
      renderer.root.findByProps({ testID: 'weight-class-900g-plus' }),
    ).toBeTruthy();
    expect(() =>
      renderer.root.findByProps({ testID: 'weight-class-5-inch' }),
    ).toThrow();
  });

  it('saves a manually-bracketed camera profile with kind and no droneModelId', async () => {
    const onCreated = jest.fn();
    const renderer = await render(onCreated);

    act(() => {
      renderer.root.findByProps({ testID: 'drone-name-input' }).props.onChangeText('My Camera Drone');
    });
    act(() => {
      renderer.root.findByProps({ testID: 'kind-camera' }).props.onPress();
    });
    act(() => {
      renderer.root
        .findByProps({ testID: 'choose-weight-class-manually' })
        .props.onPress();
    });
    act(() => {
      renderer.root.findByProps({ testID: 'weight-class-250g-900g' }).props.onPress();
    });
    await act(async () => {
      await renderer.root.findByProps({ testID: 'save-drone-profile' }).props.onPress();
    });

    expect(mockAddDroneProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Camera Drone',
        kind: 'camera',
        weightClass: '250g-900g',
      }),
    );
    expect(mockAddDroneProfile.mock.calls[0][0]).not.toHaveProperty(
      'droneModelId',
    );
    expect(onCreated).toHaveBeenCalled();
  });

  it('saves a model-seeded camera profile with droneModelId, implied weightClass, and model-resolved thresholds', async () => {
    const onCreated = jest.fn();
    const renderer = await render(onCreated);

    act(() => {
      renderer.root.findByProps({ testID: 'drone-name-input' }).props.onChangeText('My Mini');
    });
    act(() => {
      renderer.root.findByProps({ testID: 'kind-camera' }).props.onPress();
    });
    act(() => {
      renderer.root
        .findByProps({ testID: 'drone-model-dji-mini-4-pro' })
        .props.onPress();
    });

    expect(
      renderer.root.findByProps({ testID: 'default-thresholds-preview' }),
    ).toBeTruthy();
    // Selecting a model skips the bracket picker entirely.
    expect(() =>
      renderer.root.findByProps({ testID: 'weight-class-sub-250g' }),
    ).toThrow();

    await act(async () => {
      await renderer.root.findByProps({ testID: 'save-drone-profile' }).props.onPress();
    });

    expect(mockAddDroneProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Mini',
        kind: 'camera',
        droneModelId: 'dji-mini-4-pro',
        weightClass: 'sub-250g',
        thresholds: {
          windSpeedMax: 38.5,
          windGustsMax: 38.5,
          precipitationProbabilityMax: 25,
          uvIndexMax: 9,
        },
      }),
    );
    expect(onCreated).toHaveBeenCalled();
  });

  it('falls back to the manual bracket picker with no model selected when chosen after a model', async () => {
    const renderer = await render();

    act(() => {
      renderer.root.findByProps({ testID: 'kind-camera' }).props.onPress();
    });
    act(() => {
      renderer.root
        .findByProps({ testID: 'drone-model-dji-mini-4-pro' })
        .props.onPress();
    });
    act(() => {
      renderer.root
        .findByProps({ testID: 'choose-weight-class-manually' })
        .props.onPress();
    });

    expect(
      renderer.root.findByProps({ testID: 'weight-class-sub-250g' }),
    ).toBeTruthy();
    // Nothing is selected in the fallback yet, so no preview shows.
    expect(() =>
      renderer.root.findByProps({ testID: 'default-thresholds-preview' }),
    ).toThrow();
  });

  it('saves an fpv profile exactly as before', async () => {
    const onCreated = jest.fn();
    const renderer = await render(onCreated);

    act(() => {
      renderer.root.findByProps({ testID: 'drone-name-input' }).props.onChangeText('Freestyle');
    });
    act(() => {
      renderer.root.findByProps({ testID: 'kind-fpv' }).props.onPress();
    });
    act(() => {
      renderer.root.findByProps({ testID: 'weight-class-5-inch' }).props.onPress();
    });
    await act(async () => {
      await renderer.root.findByProps({ testID: 'save-drone-profile' }).props.onPress();
    });

    expect(mockAddDroneProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Freestyle',
        kind: 'fpv',
        weightClass: '5-inch',
      }),
    );
  });

  it('keeps save disabled until name, kind, and a weight class (manual) are all set', async () => {
    const renderer = await render();

    act(() => {
      renderer.root.findByProps({ testID: 'kind-camera' }).props.onPress();
    });
    expect(
      renderer.root.findByProps({ testID: 'save-drone-profile' }).props.disabled,
    ).toBe(true);

    act(() => {
      renderer.root.findByProps({ testID: 'drone-name-input' }).props.onChangeText('X');
    });
    expect(
      renderer.root.findByProps({ testID: 'save-drone-profile' }).props.disabled,
    ).toBe(true);

    act(() => {
      renderer.root
        .findByProps({ testID: 'choose-weight-class-manually' })
        .props.onPress();
    });
    act(() => {
      renderer.root.findByProps({ testID: 'weight-class-sub-250g' }).props.onPress();
    });
    expect(
      renderer.root.findByProps({ testID: 'save-drone-profile' }).props.disabled,
    ).toBe(false);
  });

  it('keeps save disabled until name and a model are both set (model sub-path)', async () => {
    const renderer = await render();

    act(() => {
      renderer.root.findByProps({ testID: 'kind-camera' }).props.onPress();
    });
    act(() => {
      renderer.root
        .findByProps({ testID: 'drone-model-dji-neo' })
        .props.onPress();
    });
    expect(
      renderer.root.findByProps({ testID: 'save-drone-profile' }).props.disabled,
    ).toBe(true);

    act(() => {
      renderer.root.findByProps({ testID: 'drone-name-input' }).props.onChangeText('X');
    });
    expect(
      renderer.root.findByProps({ testID: 'save-drone-profile' }).props.disabled,
    ).toBe(false);
  });
});
