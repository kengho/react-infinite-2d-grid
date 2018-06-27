import React, { Component } from 'react';

import divideLinesByVisibility from './divideLinesByVisibility';

const propTypes = {
  // TODO: this.
};

const defaultProps = {
  hasHeader: false,
  headerHeight: 0,
  headerWidth: 0,
};

// TODO: check that defaultCellHeight, defaultCellWidth,
//   gridRoundingLength are numbers, not strings.

// Table don't rerenders after non-scroll actions with PureComponent Grid.
// class Grid extends React.PureComponent {
class Grid extends Component {
  constructor(props) {
    super(props);

    this.currentLinesDivision = {
      rows: null,
      columns: null,
    };
  }

  componentDidMount() {
    if (this.props.onSectionRendered) {
      // TODO: default props
      this.props.onSectionRendered(this.currentLinesDivision);
    }
  }

  componentDidUpdate() {
    if (this.props.onSectionRendered) {
      this.props.onSectionRendered(this.currentLinesDivision);
    }
  }

  render() {
    const {
      scrollTop,
      scrollLeft,
      screenHeight,
      screenWidth,
      defaultCellHeight,
      defaultCellWidth,
      gridRoundingLength,
      cellRenderer,
      rowRenderer,
      extraWidth,
      extraHeight,
      onSectionRendered, // extracting from otherProps, actually not using it in render()
      hasHeader,
      headerHeight,
      headerWidth,
      gridHeaderRenderer,
      rowHeaderRenderer,
      columnHeaderRenderer,
      rowsSizes,
      rowsNumber,
      columnsSizes,
      columnsNumber,
      ...otherProps,
    } = this.props;

    this.currentLinesDivision.rows = divideLinesByVisibility({
      linesSizes: rowsSizes,
      linesNumber: rowsNumber,
      scrollSize: scrollTop,
      screenSize: screenHeight - headerHeight,
      defaultLineSize: defaultCellHeight,
      gridRoundingLength,
    });
    const {
      areas: rowsAreas,
      offsets: rowsOffsets,
    } = this.currentLinesDivision.rows;

    this.currentLinesDivision.columns = divideLinesByVisibility({
      linesSizes: columnsSizes,
      linesNumber: columnsNumber,
      scrollSize: scrollLeft,
      screenSize: screenWidth - headerWidth,
      defaultLineSize: defaultCellWidth,
      gridRoundingLength,
    });
    const {
      areas: columnsAreas,
      offsets: columnsOffsets,
    } = this.currentLinesDivision.columns;

    const realRows = rowsAreas.real;
    const compRows = rowsAreas.comp;
    const realColumns = columnsAreas.real;
    const compColumns = columnsAreas.comp;

    const sumAreaSizes = (areas) => {
      return areas.reduce((accumulator, currentValue) => {
        if (currentValue.begin !== null) {
          return accumulator + currentValue.size;
        }

        return accumulator;
      }, 0);
    };

    // See grid_map.ods.
    const grid = [];
    let rowHeaders = [];
    let columnHeaders = [];

    const rowsBeforeSize = sumAreaSizes([realRows.before, compRows.before]);
    if (rowsBeforeSize > 0) {
      grid.push(
        <div
          key="rows-before"
          style={{ height: rowsBeforeSize }}
        />
      );

      if (hasHeader) {
        rowHeaders.push(
          <div
            key={`row-header-before`}
            style={{
              width: headerWidth,
              height: rowsBeforeSize,
            }}
          />
        );
      }
    }

    const renderingRowsWrapper = [];

    const columnsBeforeSize = sumAreaSizes([realColumns.before, compColumns.before]);
    if (columnsBeforeSize > 0) {
      renderingRowsWrapper.push(
        <div
          key="columns-before"
          style={{ width: columnsBeforeSize }}
        />
      );

      if (hasHeader) {
        columnHeaders.push(
          <div
            key={`column-header-before`}
            style={{
              width: columnsBeforeSize,
              height: headerHeight,
            }}
          />
        );
      }
    }

    // 0        begin              compBegin
    // -----------|+++++++++++++++++++++|+++++++++|---------------
    // |              real              |          comp          |
    //            |            length             |
    const uniteVisibleAreas = ({ linesNumber, areas }) => {
      const union = {
        begin: null,
        length: 0,
      };

      if (areas.real.visible.begin !== null) {
        union.begin = areas.real.visible.begin;
        union.length = areas.real.visible.length;
        if (areas.comp.visible.begin !== null) {
          union.length += areas.comp.visible.length;
        } else if (areas.comp.visible.begin === null) {
          // Do nothing.
        }
      } else if (areas.real.visible.begin === null) {
        if (areas.comp.visible.begin !== null) {
          union.begin = linesNumber + areas.comp.visible.begin;
          union.length = areas.comp.visible.length;
        } else if (areas.comp.visible.begin === null) {
          // Impossible.
        }
      }

      return union;
    };

    // Uniting lines to get one big loop over them instead of
    //   dealing with real and complementary lines one by one.
    const rowsUnion = uniteVisibleAreas({
      linesNumber: rowsNumber,
      areas: rowsAreas,
    });
    const columnsUnion = uniteVisibleAreas({
      linesNumber: columnsNumber,
      areas: columnsAreas,
    });

    const renderingRows = [];
    for (
      let unionRowIndex = rowsUnion.begin;
      unionRowIndex < rowsUnion.begin + rowsUnion.length;
      unionRowIndex += 1
    ) {
      // Separating rows.
      const realRowIndex = unionRowIndex;
      const compRowIndex = unionRowIndex - rowsNumber;

      const rowSize = rowsSizes(realRowIndex) || defaultCellHeight;

      const cells = [];
      for (
        let unionColumnIndex = columnsUnion.begin;
        unionColumnIndex < columnsUnion.begin + columnsUnion.length;
        unionColumnIndex += 1
      ) {
        // Separating columns.
        const realColumnIndex = unionColumnIndex;
        const compColumnIndex = unionColumnIndex - columnsNumber;
        const columnSize = columnsSizes(realColumnIndex) || defaultCellWidth;
        const cellStyle = {
          // TODO: figure out, why minWidth doesn't required here.
          width: columnSize,
          height: rowSize,
        };
        const cellIsOnTopRow = (unionRowIndex === rowsUnion.begin);
        const cellIsReal = (compRowIndex < 0 && compColumnIndex < 0);
        const cell = cellRenderer({
          rowIndex: realRowIndex,
          columnIndex: realColumnIndex,
          style: cellStyle,
          isReal: cellIsReal,
          isOnTopRow: cellIsOnTopRow,
        });

        cells.push(cell);

        if (hasHeader && cellIsOnTopRow) {
          const columnHeader = columnHeaderRenderer({
            style: {
              // minWidth required instead of width because of flex layout.
              minWidth: columnSize,
              height: headerHeight,
            },
            index: unionColumnIndex,
            isReal: cellIsReal,
          });
          columnHeaders.push(columnHeader);
        }
      }

      const rowIsReal = (compRowIndex < 0);
      const rowStyle = {
        height: rowSize,
        display: 'flex',
        flexDirection: 'row',
      };
      const renderingRow = rowRenderer({
        index: realRowIndex,
        cells,
        style: rowStyle,
        isReal: rowIsReal,
      });

      renderingRows.push(renderingRow);

      if (hasHeader) {
        const rowHeader = rowHeaderRenderer({
          style: {
            width: headerWidth,
            height: rowSize,
          },
          index: unionRowIndex,
          isReal: rowIsReal,
        });
        rowHeaders.push(rowHeader);
      }
    }

    renderingRowsWrapper.push(
      <div
        key="cells"
        style={{ tableLayout: 'fixed' }}
      >
        {renderingRows}
      </div>
    );

    if (realColumns.after.size > 0) {
      renderingRowsWrapper.push(
        <div
          key="columns-after"
          style={{ width: realColumns.after.size }}
        />
      );
    }

    if (extraWidth) {
      renderingRowsWrapper.push(
        <div
          key="extra-columns-after"
          style={{ width: extraWidth }}
        />
      );
    }

    grid.push(
      <div
        key="real-cells"
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {renderingRowsWrapper}
      </div>
    );

    if (realRows.after.size > 0) {
      grid.push(
        <div
          key="rows-after"
          style={{ height: realRows.after.size }}
        />
      );
    }

    if (extraHeight) {
      renderingRowsWrapper.push(
        <div
          key="extra-rows-after"
          style={{ height: extraHeight }}
        />
      );
    }

    const gridStyle = {};
    let gridHeader = '';
    let rowHeadersWrapper = '';
    let columnHeadersWrapper = '';
    if (hasHeader) {
      // Make space for headers.
      gridStyle.margin = `${headerHeight}px 0 0 ${headerWidth}px`;

      gridHeader = gridHeaderRenderer({
        style: {
          position: 'fixed',
          top: '0',
          left: '0',
          zIndex: '1000',
          height: `${headerHeight}px`,
          width: `${headerWidth}px`,
        },
      });

      rowHeadersWrapper = (
        <div
          style={{
            position: 'absolute',
            top: headerHeight,
            left: '0',
            height: '0',
            zIndex: '900',
            width: `${scrollLeft + screenWidth}px`, // so headers never reach bottom of the it's contaiver
          }}
        >
          <div
            style={{
              // display: 'flex', // not needed since divs stacks on top of each other naturally
              // flexDirection: 'column',
              position: 'sticky',
              left: '0',
              width: '0', // for div not to occupy entire screen blocking grid underneath
            }}
          >
            {rowHeaders}
          </div>
        </div>
      );

      columnHeadersWrapper = (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: headerWidth,
            zIndex: '900',
            height: `${scrollTop + screenHeight}px`,
            width: '0',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              position: 'sticky',
              top: '0',
            }}
          >
            {columnHeaders}
          </div>
        </div>
      );
    }

    // REVIEW: there is no point of keeping absolute positioned
    //   headers in main div, but we lose otherProps we want
    //   to apply to them otherwise.
    return (
      <div {...otherProps} style={gridStyle}>
        {grid}
        {gridHeader}
        {rowHeadersWrapper}
        {columnHeadersWrapper}
      </div>
    );
  }
}

Grid.propTypes = propTypes;
Grid.defaultProps = defaultProps;

export default Grid;