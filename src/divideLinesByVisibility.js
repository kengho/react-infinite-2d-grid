// To future me: this seems like very complicated way for just dividing grid area,
//   but trust me, in fact, it's the simplest way.
//   In this algorithm we have nice and clear steps with testable intermediate
//   states, and thorough brute-force of all mathematically possible combinations,
//   thus "no unforseen case shall escape my sight".
//   (I dont have proofs for impossibility of some branches yet,
//   but those cases seems obvious enough. TODO: do them.)
//
//   Note that there is no magic, no "x + 1" and stuff (almost!), and that is amazing.
//
//   TODO: nevertheless, it definitely requires more visual explanation besides tests.

// For dev.
process.log = (x) => console.log(JSON.stringify(x, null, 2));

export function getLineOffset({
  linesOffests,
  index,
  defaultLineSize,
  gapSize = 0,
}) {
  if (Number.isInteger(linesOffests[index])) {
    return linesOffests[index];
  } else {
    const lastLineOffset = linesOffests[linesOffests.length - 1];

    // NOTE: +1 because linesOffests.length == lines.length + 1
    const compLinesNumber = index - linesOffests.length + 1;

    return lastLineOffset + compLinesNumber * (defaultLineSize + gapSize);
  }
}

export function sumRealLinesSizesRange({
  linesSizes,
  linesNumber,
  defaultLineSize,
  begin,
  end,
  gapSize = 0,
  callback = () => {},
}) {
  let accumulator = 0;
  const effectiveEnd = Math.min(end, linesNumber);
  for (let index = begin; index < effectiveEnd; index += 1) {
    const lineSize = linesSizes(index) || defaultLineSize;
    const currentEffectiveLineSize = lineSize + gapSize;

    callback({
      begin,
      index,
      currentEffectiveLineSize,
      previousAccumulator: accumulator,
    });

    accumulator += currentEffectiveLineSize;
  }

  return {
    sum: accumulator,
    length: effectiveEnd - begin,
  };
};

export default function divideLinesByVisibility({
  linesSizes,
  linesNumber,
  scrollSize,
  screenSize,
  defaultLineSize,
  gridRoundingLength,
  gapSize = 0,

  // For dev.
  logThisCall,
}) {
  // TODO: check args and throw some errors to the console.

  // For dev.
  const clog = (x) => {
    if (logThisCall) {
      process.log(x);
    }
  };

  // Code optimized for particular use-case when
  //   you render visible lines and some amount of lines
  //   before and after that. It might work for
  //   "gridRoundingLength === 0" case, but I didn't checked.
  if (!gridRoundingLength || gridRoundingLength < 1) {
    return;
  }

  // TODO: gridRoundingLength should probably be splitted
  //   into gridRoundingLength and gridOverflowLength.

  const result = {
    offsets: [0],
    rawVisibleArea: {
      begin: null,
      length: 0,
    },
    areas: {
      real: {
        before: {
          begin: 0, // we need that zero for lesser branching after first step
          length: 0,
          size: 0,
        },
        visible: {
          begin: null,
          length: 0,
          size: 0,
        },
        after: {
          begin: null,
          length: 0,
          size: 0,
        },
      },
      comp: {
        before: {
          begin: null,
          length: 0,
          size: 0,
        },
        visible: {
          begin: null,
          length: 0,
          size: 0,
        },
      },
    },
  };

  const realLines = result.areas.real;
  const realBefore = realLines.before;
  const realVisible = realLines.visible;
  const realAfter = realLines.after;
  const compLines = result.areas.comp;
  const compBefore = compLines.before;
  const compVisible = compLines.visible;
  const offsets = result.offsets;
  const rawVisibleArea = result.rawVisibleArea;

  const normalizeAreas = () => {
    [realBefore, realVisible, realAfter].forEach((areaContainer) => {
      if (areaContainer.length === 0) {
        areaContainer.begin = null;
      }
    });
  };

  // Step 1: going through all the lines and gather
  //   maximum possible information while doing it.

  const initArea = (areaContainer, begin) => {
    if (areaContainer.begin === null) {
      areaContainer.begin = begin;
    }
  };

  const adjustArea = (
    areaContainer,
    lengthIncrement,
    sizeIncrement = 0,
    beginIncrement = 0
  ) => {
    areaContainer.begin += beginIncrement;
    areaContainer.length += lengthIncrement;
    areaContainer.size += sizeIncrement;
  };

  const overallShiftSize = scrollSize + screenSize;
  let sizeAccumulator = 0;

  const sumRealLinesSizesRangeCallback = ({
    begin,
    index,
    currentEffectiveLineSize,
    previousAccumulator,
  }) => {
      const currentOffset = sizeAccumulator + previousAccumulator;
      offsets[index + 1] = currentOffset + currentEffectiveLineSize;

      if (rawVisibleArea.begin === null && currentOffset > scrollSize) {
        // Previous index was the actual match.
        //   It can't be < 0 because of strict unequality in condition.
        const previousUnslicedLinesIndex = index - 1;
        rawVisibleArea.begin = previousUnslicedLinesIndex;
      }

      if (
        rawVisibleArea.begin !== null &&
        rawVisibleArea.length === 0 &&
        currentOffset > overallShiftSize
      ) {
        rawVisibleArea.length = index - rawVisibleArea.begin;
      }
  };

  // Main loop.
  for (let index = 0; index < linesNumber; index += gridRoundingLength) {
    const {
      sum: sizeIncrement,
      length: incrementLength,
    } = sumRealLinesSizesRange({
      linesSizes,
      linesNumber,
      defaultLineSize,
      begin: index,
      end: index + gridRoundingLength,
      gapSize,
      callback: sumRealLinesSizesRangeCallback,
    });

    sizeAccumulator += sizeIncrement;

    if (sizeAccumulator < scrollSize) {
      initArea(realBefore, 0);
      adjustArea(realBefore, incrementLength, sizeIncrement);
    // Adding sizeIncrement to make visible lines
    //   definitely overlap actual visible area.
    } else if (sizeAccumulator < overallShiftSize + sizeIncrement) {
      initArea(realVisible, index);
      adjustArea(realVisible, incrementLength, sizeIncrement);
    } else if (sizeAccumulator >= overallShiftSize + sizeIncrement) {
      initArea(realAfter, index);
      adjustArea(realAfter, incrementLength, sizeIncrement);
    }
  }

  // For dev.
  clog('result.areas after main loop')
  clog(result.areas)

  // Step 2: adjust areas in case loop didn't catch entire scroll and screen sizes.

  // Possible values for areas' beginnings after step 1:
  //   realBefore && realVisible && realAfter
  //   realBefore && realVisible && !realAfter
  //   realBefore && !realVisible && realAfter
  //   realBefore && !realVisible && !realAfter
  //   (realBefore.begin couldn't be null because we initialized it with 0)
  //   (some of the combinations never occur IRL (TODO: prove it)).

  const overallOverflowSize = scrollSize + screenSize - sizeAccumulator;
  const fullCompLinesLength = Math.floor((overallOverflowSize) / (defaultLineSize + gapSize));
  const partialCompLinesLength = fullCompLinesLength + 1;
  if (realVisible.begin !== null) {
    if (realAfter.begin !== null) { // realBefore && realVisible && realAfter
      // Never happens.
    } else if (realAfter.begin === null) { // realBefore && realVisible && !realAfter
      const remainder = (linesNumber + fullCompLinesLength) % gridRoundingLength;
      realVisible.length += fullCompLinesLength - remainder + gridRoundingLength;

      rawVisibleArea.length = linesNumber + partialCompLinesLength - rawVisibleArea.begin;
    }
  } else if (realVisible.begin === null) {
    if (realAfter.begin !== null) { // realBefore && !realVisible && after
      // Never happens.
    } else if (realAfter.begin === null) { // realBefore && !realVisible && !realAfter
      // Squeeze real lines here. In case they should really be complementary,
      //   we will handle them accordingly later.

      const scrollOverflowSize = scrollSize - sizeAccumulator;
      const fullCompLinesBeforeScreenLength = Math.floor((scrollOverflowSize) / (defaultLineSize + gapSize));
      let remainder = (linesNumber + fullCompLinesBeforeScreenLength) % gridRoundingLength;
      const compBegin = fullCompLinesBeforeScreenLength - remainder;

      realBefore.length += compBegin;
      realVisible.begin = realBefore.begin + realBefore.length;
      remainder = (linesNumber + fullCompLinesLength) % gridRoundingLength;
      const visibleOverflowLength = realVisible.begin - linesNumber;
      realVisible.length = fullCompLinesLength - visibleOverflowLength - remainder;
      realVisible.length += gridRoundingLength;

      rawVisibleArea.begin = linesNumber + fullCompLinesBeforeScreenLength;
      rawVisibleArea.length = partialCompLinesLength - fullCompLinesBeforeScreenLength;
    }
  }

  normalizeAreas();

  // For dev.
  clog('result.areas after adjusting')
  clog(result.areas)

  // Step 3: expand visible area.
  //   If it extends beyond lines, do nothing about it,
  //   just don't increment size, we'll do it later.

  // Possible values for areas' beginnings after step 2:
  //   realBefore && realVisible && realAfter
  //   realBefore && realVisible && !realAfter
  //   realBefore && !realVisible && realAfter
  //   realBefore && !realVisible && !realAfter
  //   !realBefore && realVisible && realAfter
  //   !realBefore && realVisible && !realAfter
  //   !realBefore && !realVisible && realAfter
  //   !realBefore && !realVisible && !realAfter
  //   (some of the combinations never occur IRL (TODO: prove it)).

  if (realBefore.begin !== null) {
    if (realVisible.begin !== null) { // realBefore && realVisible && (realAfter || !realAfter)
      // Move realBefore-realVisible border.

      const reducedBeforeLength = Math.max(realBefore.length - gridRoundingLength, 0);
      const beforeLengthDiff = realBefore.length - reducedBeforeLength;
      const movingBeforeRangeEnd = realBefore.begin + realBefore.length; // in terms of slice() end not included
      const movingBeforeRangeBegin = movingBeforeRangeEnd - beforeLengthDiff;

      // NOTE:
      //   if (movingBeforeRangeBegin >= movingBeforeRangeEnd) {
      //     lines.slice(movingBeforeRangeBegin, movingBeforeRangeEnd).length === 0; // true
      //     movingFromBeforeToVisibleSize === 0; // true
      //   }
      //   This trick allows us not to test cases for beforeLengthDiff === 0.
      const { sum: movingFromBeforeToVisibleSize } = sumRealLinesSizesRange({
        linesSizes,
        linesNumber,
        defaultLineSize,
        begin: movingBeforeRangeBegin,
        end: movingBeforeRangeEnd,
        gapSize,
      });

      realVisible.begin -= beforeLengthDiff;
      realBefore.length -= beforeLengthDiff;
      realVisible.length += beforeLengthDiff;
      realBefore.size -= movingFromBeforeToVisibleSize;
      realVisible.size += movingFromBeforeToVisibleSize;

      if (realAfter.begin !== null) { // realBefore && realVisible && realAfter
        // Move realVisible-realAfter border.

        const afterLengthDiff = gridRoundingLength;
        const movingAfterRangeBegin = realAfter.begin;
        const movingAfterRangeEnd = movingAfterRangeBegin + afterLengthDiff;
        const { sum: movingFromAfterToVisibleSize } = sumRealLinesSizesRange({
          linesSizes,
          linesNumber,
          defaultLineSize,
          begin: movingAfterRangeBegin,
          end: movingAfterRangeEnd,
          gapSize,
        });

        realAfter.begin += afterLengthDiff;
        realVisible.length += afterLengthDiff;
        realAfter.length -= afterLengthDiff;
        realVisible.size += movingFromAfterToVisibleSize;
        realAfter.size -= movingFromAfterToVisibleSize;
      } else if (realAfter.begin === null) { // realBefore && realVisible && !realAfter
        // Move realVisible upper boundary.

        realVisible.length += gridRoundingLength;
      }
    } else if (realVisible.begin === null) {
      // Never happens.
      // if (realAfter.begin !== null) { // realBefore && !realVisible && realAfter
      // } else if (realAfter.begin === null) { // realBefore && !realVisible && !realAfter
      // }
    }
  } else if (realBefore.begin === null) {
    // Never happens.
    // if (realVisible.begin !== null) {
    //   if (realAfter.begin !== null) { // !realBefore && realVisible && realAfter
    //   } else if (realAfter.begin === null) { // !realBefore && realVisible && !realAfter
    //   }
    // } else if (realVisible.begin === null) {
    //   if (realAfter.begin !== null) { // !realBefore && !realVisible && realAfter
    //   } else if (realAfter.begin === null) { // !realBefore && !realVisible && !realAfter
    //   }
    // }
  }

  normalizeAreas();

  // For dev.
  clog('result.areas after expanding')
  clog(result.areas)

  // Step 4: cut overflowing areas.

  // Possibilities for validity of areas after step 3:
  //   comp && !realBefore && !realVisible && !realAfter
  //   !comp && realBefore && realVisible && realAfter
  //   !comp && realBefore && realVisible && !realAfter
  //   !comp && realBefore && !realVisible && realAfter
  //   !comp && realBefore && !realVisible && !realAfter
  //   !comp && !realBefore && realVisible && realAfter
  //   !comp && !realBefore && realVisible && !realAfter
  //   !comp && !realBefore && !realVisible && realAfter
  //   !comp && !realBefore && !realVisible && !realAfter
  //   (again, some of the combinations never occur IRL (TODO: again, prove it)).

  const areaOverflows = (area) => area.begin !== null && (area.begin + area.length > linesNumber);
  const beforeOverflows = areaOverflows(realBefore);
  const visibleOverflows = areaOverflows(realVisible);
  const afterOverflows = areaOverflows(realAfter);
  const compUnderflows = compLines.begin !== null && (compLines.begin < 0);
  if (compUnderflows) {
    // Couldn't happen because of the way comp was created during adjusting step.
  } else if (!compUnderflows) {
    if (!beforeOverflows) {
      if (!visibleOverflows) {
        if (!afterOverflows) { // !beforeOverflows && !visibleOverflows && !afterOverflows
          // It's OK then.
        } else if (afterOverflows) { // !beforeOverflows && !visibleOverflows && afterOverflows
          const extraAfterLength = realAfter.begin + realAfter.length - linesNumber;
          realAfter.length -= extraAfterLength;
        }
      } else if (visibleOverflows) {
        if (!afterOverflows) { // !beforeOverflows && visibleOverflows && !afterOverflows
          const visibleCompLinesLength = realVisible.begin + realVisible.length - linesNumber;
          compVisible.begin = 0;
          compVisible.length = visibleCompLinesLength;
          realVisible.length -= visibleCompLinesLength;
          compVisible.size = visibleCompLinesLength * (defaultLineSize + gapSize);
        } else if (afterOverflows) { // !beforeOverflows && visibleOverflows && afterOverflows
          // Never happens.
        }
      }
    } else if (beforeOverflows) {
      if (!visibleOverflows) {
        // Never happens.
        // if (!afterOverflows) { // beforeOverflows && !visibleOverflows && !afterOverflows
        // } else if (afterOverflows) { // beforeOverflows && !visibleOverflows && afterOverflows
        // }
      } else if (visibleOverflows) {
        if (!afterOverflows) { // beforeOverflows && visibleOverflows && !afterOverflows
          const beforeCompLinesLength = realBefore.begin + realBefore.length - linesNumber;
          compBefore.begin = 0;
          compBefore.length = beforeCompLinesLength;
          compBefore.size = beforeCompLinesLength * (defaultLineSize + gapSize);
          realBefore.length -= beforeCompLinesLength;

          const visibleCompLinesLength = realVisible.length;
          compVisible.begin = compBefore.begin + compBefore.length;
          compVisible.length = visibleCompLinesLength;
          compVisible.size = visibleCompLinesLength * (defaultLineSize + gapSize);
          realVisible.begin = null;
          realVisible.length = 0;
          realVisible.size = 0;
        } else if (afterOverflows) { // beforeOverflows && visibleOverflows && afterOverflows
          // Never happens.
        }
      }
    }
  }

  normalizeAreas();

  // And we're done!

  // For dev.
  clog('result after all')
  clog(result.areas)

  return result;
};
