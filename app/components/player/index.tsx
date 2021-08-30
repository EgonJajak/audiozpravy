import React, { FC, useState } from "react";
import { useMemo } from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import Color from "../../shared/colors";
import { Record } from "../../shared/types";
import Description from "../typography/description";
import Queue from "./queue";
import Progress from "./progress";
import PlaybackControls from "./playback-controls";
import { Audio } from "expo-av";
import { useEffect } from "react";

interface Props extends ViewProps {
  queue: Record[];
  hideQueue?: boolean;
  hideDescription?: boolean;
}

const emptyQueueRecord: Record = {
  description: "-",
  duration: 5,
  uri: "../../assets/mock-horn-fail.mp3",
};

const Player: FC<Props> = ({ style, queue, hideQueue, hideDescription }) => {
  const recordsCount = queue.length;
  const [currentRecordIndex, setCurrentRecordIndex] = useState(
    recordsCount ? 0 : -1
  );
  const record = useMemo(
    () => queue[currentRecordIndex] || emptyQueueRecord,
    [currentRecordIndex, queue]
  );

  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(record.duration || 0);
  const [sound, setSound] = React.useState<Audio.Sound>();

  async function loadSound() {
    if (sound) {
      return sound;
    }

    console.log("loading sound");
    const { sound: loadedSound } = await Audio.Sound.createAsync(
      require("../../assets/mock-horn-fail.mp3"),
      { positionMillis: currentTime * 1000 }
    );

    const status = await loadedSound.getStatusAsync();

    setSound(loadedSound);
    if (status.isLoaded && status.durationMillis) {
      setTotalDuration(Math.ceil(status.durationMillis / 1000));
    }

    loadedSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        console.log(status.positionMillis);
        setCurrentTime(Math.ceil(status.positionMillis / 1000));
      } else {
        console.error("Jajx");
      }
    });
    return loadedSound;
  }

  async function playSound() {
    const status = await sound.getStatusAsync();

    if (status.isLoaded) {
      console.log(`${status.isPlaying ? "Pausing" : "Playing"} Sound`);
      await sound.setStatusAsync({ shouldPlay: !status.isPlaying });
    } else {
      console.log("Not loaded yet, cannot play");
    }
  }

  React.useEffect(() => {
    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    loadSound();
  }, [record]);

  return (
    <View
      style={StyleSheet.compose(
        {
          backgroundColor: Color["black-100"],
          padding: 16,
          width: "100%",
        },
        style
      )}
    >
      {hideQueue ? null : (
        <Queue size={recordsCount} currentIndexZeroBased={currentRecordIndex} />
      )}
      {hideDescription ? null : (
        <Description
          style={{ color: "white", marginTop: 16 }}
          numberOfLines={2}
        >
          {record.description}
        </Description>
      )}
      <Progress
        currentSecond={currentTime}
        totalSeconds={totalDuration}
        onChange={(handlePos) => {
          setCurrentTime(Math.floor(handlePos));
        }}
        style={{ marginTop: 16 }}
      />
      <PlaybackControls
        onRewind={() => {
          setCurrentTime(Math.max(currentTime - 10, 0));
        }}
        onPlayPause={() => {
          playSound();
        }}
        onNext={() => {
          setCurrentRecordIndex((index) => {
            const nextIndex = index < recordsCount - 1 ? index + 1 : index;

            return nextIndex;
          });
          setCurrentTime(0);
        }}
        style={{ marginTop: 20 }}
      />
    </View>
  );
};

export default Player;
