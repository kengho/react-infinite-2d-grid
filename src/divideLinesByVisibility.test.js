import { expect } from 'chai';

import divideLinesByVisibility, { sumRealLinesSizesRange } from './divideLinesByVisibility';

// For dev.
const logThisCall = true;

const lines = [
  { size: 100 },
  { size: 200 },
  { size: 150 },
  { size: 50 },
  {}, // default === 100, testing lines with no size
  { size: 200 },
  { size: 200 },
  { size: 200 },
  { size: 150 },
  { size: 100 },
];

const linesNumber = lines.length;

// Gap 25.
const linesOffests = [
  0,
  100 + 25,
  100 + 25 + 200 + 25,
  100 + 25 + 200 + 25 + 150 + 25,
  100 + 25 + 200 + 25 + 150 + 25 + 50 + 25,
  100 + 25 + 200 + 25 + 150 + 25 + 50 + 25 + 100 + 25,
  100 + 25 + 200 + 25 + 150 + 25 + 50 + 25 + 100 + 25 + 200 + 25,
  100 + 25 + 200 + 25 + 150 + 25 + 50 + 25 + 100 + 25 + 200 + 25 + 200 + 25,
  100 + 25 + 200 + 25 + 150 + 25 + 50 + 25 + 100 + 25 + 200 + 25 + 200 + 25 + 200 + 25,
  100 + 25 + 200 + 25 + 150 + 25 + 50 + 25 + 100 + 25 + 200 + 25 + 200 + 25 + 200 + 25 + 150 + 25,
  100 + 25 + 200 + 25 + 150 + 25 + 50 + 25 + 100 + 25 + 200 + 25 + 200 + 25 + 200 + 25 + 150 + 25 + 100 + 25,
];
// NOTE: linesOffests.length == lines.length + 1
//   Last linesOffests is offset of first comp line.

const defaultLineSize = 100;

const linesSizes = (i) => lines[i].size;

describe('case 1 (visible area consists of real lines entirely)', () => {
  it('should separate area', () => {
    // lines (gap 25) =>
    //  0      1       2    3   4      5        6        7       8     9
    // 100 |  200   | 150  |50|100 |  200   |  200   |  200   | 150  |100
    // ----|--------|------|--|----|--------|--------|--------|------|----| # no rounding
    // -------------|---------|------+++++++|+++--------------|-----------| # round by 2
    // --------------------|---------++++++-|------------------------|----- # round by 3
    // .............................|...........
    //             750 (30)           300 (12)
    //              scroll             screen
    //                              |......
    //                               150 (6)
    //                               screen
    expect(divideLinesByVisibility({
      linesSizes,
      linesNumber,
      scrollSize: 30*25,
      screenSize: 12*25,
      defaultLineSize,
      gapSize: 25,
      gridRoundingLength: 2,
    })).to.deep.equal({
      offsets: linesOffests,
      rawVisibleArea: { // [5, 6]
        begin: 5,
        length: 2,
      },
      areas: {
        real: {
          before: { // [0, 1]
            begin: 0,
            length: 2,
            size: 14*25,
          },
          visible: { // [2, 9]
            begin: 2,
            length: 8,
            size: 54*25,
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
    }, 'case 30/12/2');

    expect(divideLinesByVisibility({
      linesSizes,
      linesNumber,
      scrollSize: 30*25,
      screenSize: 6*25,
      defaultLineSize,
      gapSize: 25,
      gridRoundingLength: 3,
    })).to.deep.equal({
      offsets: linesOffests,
      rawVisibleArea: { // [5, 5]
        begin: 5,
        length: 1,
      },
      areas: {
        real: {
          before: {
            begin: null,
            length: 0,
            size: 0,
          },
          visible: { // [0, 8]
            begin: 0,
            length: 9,
            size: 63*25,
          },
          after: { // [9, 9]
            begin: 9,
            length: 1,
            size: 5*25,
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
    }, 'case 30/6/3');
  });
});

describe('case 2 (visible area consists of real and complementary lines)', () => {
  it('should separate area', () => {
    // lines (gap 25) =>
    //  0      1       2    3   4      5       6        7       8     9    c0    c1   c2   c3   c4   c5   c6   c7   c8
    // 100 |  200   | 150  |50|100 |  200   |  200   |  200   | 150  |100 |100 |100 |100 |100 |100 |100 |100 |100 |100 |
    // ----|--------|------|--|----|--------|--------|--------|------|----|----|----|----|----|----|----|----|----|----| # no rounding
    // -------------|---------|------+++++++|+++++++++++++++++|+++++++++++|++++++---|---------|---------|---------|----- # round by 2
    // --------------------|---------.......|.......-----------------|--------------|---++++++++---|--------------|----- # round by 3
    // .............................|............................................
    //             750 (30)                             1100 (44)
    //              scroll                               screen
    // --------------------------------------------------------------------------------|--------
    //                                   2025 (81)                                        200 (8)
    //                                    scroll                                          screen
    expect(divideLinesByVisibility({
      linesSizes,
      linesNumber,
      scrollSize: 30*25,
      screenSize: 44*25,
      defaultLineSize,
      gapSize: 25,
      gridRoundingLength: 2,
    })).to.deep.equal({
      offsets: linesOffests,
      rawVisibleArea: { // [5, 11]
        begin: 5,
        length: 7,
      },
      areas: {
        real: {
          before: { // [0, 1]
            begin: 0,
            length: 2,
            size: 14*25,
          },
          visible: { // [2, 9]
            begin: 2,
            length: 8,
            size: 54*25,
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
          visible: { // [0, 3]
            begin: 0,
            length: 4,
            size: 20*25,
          },
        },
      },
    }, 'case 30/44/2');

    expect(divideLinesByVisibility({
      linesSizes,
      linesNumber,
      scrollSize: 81*25,
      screenSize: 8*25,
      defaultLineSize,
      gapSize: 25,
      gridRoundingLength: 3,
    })).to.deep.equal({
      offsets: linesOffests,
      rawVisibleArea: { // [12, 14]
        begin: 12,
        length: 3,
      },
      areas: {
        real: { // [0, 8]
          before: {
            begin: 0,
            length: 9,
            size: 63*25,
          },
          visible: { // [9, 9]
            begin: 9,
            length: 1,
            size: 5*25,
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
          visible: { // [0, 7]
            begin: 0,
            length: 8,
            size: 40*25,
          },
        },
      },
    }, 'case 82/8/3');
  });
});

describe('case 3 (only complementary lines are visible)', () => {
  it('should separate area', () => {
    // lines (gap 25) =>
    //  0      1       2    3   4      5       6        7        8     9   c0   c1   c2   c3   c4   c5   c6   c7   c8   c9   c10
    // 100 |  200   | 150  |50|100 |  200   |  200   |  200   | 150  |100 |100 |100 |100 |100 |100 |100 |100 |100 |100 |100 |100 |
    // ----|--------|------|--|----|--------|--------|--------|------|----|----|----|----|----|----|----|----|----|----|----|----|
    // -------------|---------|-------------|-----------------|-----------|---------|------+++|++++-----|---------|---------|----- # round by 2
    // --------------------|----------------|------------------------|--------------|--------------|-----+++++++++|++------------| # round by 3
    // ...................................................................................|........
    //                                  2100 (84)                                          200 (8)
    //                                   scroll                                             screen
    // .................................................................................................|............
    //                                     2450 (98)                                                       300 (12)
    //                                      scroll                                                          screen
    expect(divideLinesByVisibility({
      linesSizes,
      linesNumber,
      scrollSize: 84*25,
      screenSize: 8*25,
      defaultLineSize,
      gapSize: 25,
      gridRoundingLength: 2,
    })).to.deep.equal({
      offsets: linesOffests,
      rawVisibleArea: { // [13, 14]
        begin: 13,
        length: 2,
      },
      areas: {
        real: {
          before: {
            begin: 0,
            length: 10,
            size: 68*25,
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
          visible: { // [0, 7]
            begin: 0,
            length: 8,
            size: 40*25,
          },
        },
      },
    }, 'case 84/8/2');

    expect(divideLinesByVisibility({
      linesSizes,
      linesNumber,
      scrollSize: 98*25,
      screenSize: 12*25,
      defaultLineSize,
      gapSize: 25,
      gridRoundingLength: 3,
    })).to.deep.equal({
      offsets: linesOffests,
      rawVisibleArea: { // [16, 18]
        begin: 16,
        length: 3,
      },
      areas: {
        real: {
          before: {
            begin: 0,
            length: 10,
            size: 68*25,
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
            begin: 0,
            length: 2,
            size: 10*25,
          },
          visible: { // [2, 13]
            begin: 2,
            length: 12,
            size: 60*25,
          },
        },
      },
    }, 'case 98/12/2');
  });

  describe('case 3a (there are only complementary lines)', () => {
    it('should separate area', () => {
      // lines (gap 25) =>
      // c0   c1   c2   c3   c4   c5   c6   c7   c8   c9   c10
      // 100 |100 |100 |100 |100 |100 |100 |100 |100 |100 |100 |
      // ----|----|----|----|----|----|----|----|----|----|----|
      // ---------|------+++|++++-----|---------|---------|----- # round by 2
      // --------------|--------------|--++++++++++++|---------- # round by 3
      // ...............|........
      //      400 (16)   200 (8)
      //       scroll    screen
      // ...............................|............
      //         800 (32)                 300 (12)
      //          scroll                   screen
      expect(divideLinesByVisibility({
        linesSizes: () => {},
        linesNumber: 0,
        scrollSize: 16*25,
        screenSize: 8*25,
        defaultLineSize,
        gapSize: 25,
        gridRoundingLength: 2,
      })).to.deep.equal({
        offsets: [0],
        rawVisibleArea: { // [3, 4]
          begin: 3,
          length: 2,
        },
        areas: {
          real: {
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
            visible: { // [0, 7]
              begin: 0,
              length: 8,
              size: 40*25,
            },
          },
        },
      }, 'case []/16/8/2');

      expect(divideLinesByVisibility({
        linesSizes: () => {},
        linesNumber: 0,
        scrollSize: 32*25,
        screenSize: 12*25,
        defaultLineSize,
        gapSize: 25,
        gridRoundingLength: 3,
      })).to.deep.equal({
        offsets: [0],
        rawVisibleArea: { // [6, 8]
          begin: 6,
          length: 3,
        },
        areas: {
          real: {
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
            after: {
              begin: null,
              length: 0,
              size: 0,
            },
          },
          comp: {
            before: {
              begin: 0,
              length: 3,
              size: 15*25,
            },
            visible: { // [3, 11]
              begin: 3,
              length: 9,
              size: 45*25,
            },
          },
        },
      }, 'case []/32/12/3');
    });
  });
});
