import React, { Component } from 'react';
import PropTypes from 'prop-types';

import divideLinesByVisibility, { getLineOffset } from './divideLinesByVisibility';

const propTypes = {
  cellRenderer: PropTypes.func.isRequired,
  columnHeaderRenderer: PropTypes.func,
  columnsNumber: PropTypes.number.isRequired,
  columnsSizes: PropTypes.func.isRequired,
  defaultCellHeight: PropTypes.number.isRequired,
  defaultCellWidth: PropTypes.number.isRequired,
  extraHeight: PropTypes.string,
  extraWidth: PropTypes.string,
  gridHeaderRenderer: PropTypes.func,
  gridRoundingLength: PropTypes.number.isRequired,
  hasHeader: PropTypes.bool,
  headerHeight: PropTypes.number,
  headerWidth: PropTypes.number,
  onSectionRendered: PropTypes.func.isRequired,
  rowHeaderRenderer: PropTypes.func,
  rowsNumber: PropTypes.number.isRequired,
  rowsSizes: PropTypes.func.isRequired,
  screenHeight: PropTypes.number.isRequired,
  screenWidth: PropTypes.number.isRequired,
  scrollLeft: PropTypes.number.isRequired,
  scrollTop: PropTypes.number.isRequired,
};

const defaultProps = {
  columnHeaderRenderer: () => {},
  extraHeight: '0',
  extraWidth: '0',
  gridHeaderRenderer: () => {},
  hasHeader: false,
  headerHeight: 0,
  headerWidth: 0,
  rowHeaderRenderer: () => {},
};

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
      cellRenderer,
      columnHeaderRenderer,
      columnsNumber,
      columnsSizes,
      defaultCellHeight,
      defaultCellWidth,
      extraHeight,
      extraWidth,
      gridHeaderRenderer,
      gridRoundingLength,
      hasHeader,
      onSectionRendered, // extracting from otherProps, actually not using it in render()
      rowHeaderRenderer,
      rowsNumber,
      rowsSizes,
      screenHeight,
      screenWidth,
      scrollLeft,
      scrollTop,
      ...otherPropsNoConst,
    } = this.props;

    let {
      headerHeight,
      headerWidth,
      ...otherProps,
    } = otherPropsNoConst;

    if (!hasHeader) {
      headerHeight = 0;
      headerWidth = 0;
    }

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

    const rowsBeforeSize = sumAreaSizes([realRows.before, compRows.before]);
    const columnsBeforeSize = sumAreaSizes([realColumns.before, compColumns.before]);

    const cells = [];
    const rowHeaders = [
      ...(hasHeader ? [
        <div
          key="row-headers-before"
          style={{
            width: headerWidth,
            height: rowsBeforeSize,
          }}
        />,
      ] : []),
    ];
    const columnHeaders = [
      ...(hasHeader ? [
        <div
          key="column-headers-before"
          style={{
            minWidth: columnsBeforeSize,
            height: headerHeight,
          }}
        />,
      ] : []),
    ];

    for (
      let unionRowIndex = rowsUnion.begin;
      unionRowIndex < rowsUnion.begin + rowsUnion.length;
      unionRowIndex += 1
    ) {
      // Separating rows.
      const realRowIndex = unionRowIndex;
      const compRowIndex = unionRowIndex - rowsNumber;

      const rowSize = rowsSizes(realRowIndex) || defaultCellHeight;

      const row = [];
      for (
        let unionColumnIndex = columnsUnion.begin;
        unionColumnIndex < columnsUnion.begin + columnsUnion.length;
        unionColumnIndex += 1
      ) {
        // Separating columns.
        const realColumnIndex = unionColumnIndex;
        const compColumnIndex = unionColumnIndex - columnsNumber;
        const columnSize = columnsSizes(realColumnIndex) || defaultCellWidth;
        const rowOffset = getLineOffset({
          linesOffests: rowsOffsets,
          index: realRowIndex,
          defaultLineSize: defaultCellHeight,
        });
        const columnOffset = getLineOffset({
          linesOffests: columnsOffsets,
          index: realColumnIndex,
          defaultLineSize: defaultCellWidth,
        });
        const cellStyle = {
          // TODO: figure out, why minWidth doesn't required here.
          width: columnSize,
          height: rowSize,
          position: 'absolute',
          top: rowOffset + headerHeight,
          left: columnOffset + headerWidth,
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

        row.push(cell);

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

      cells.push(row);

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

    return (
      <div
        style={hasHeader ? { 'margin': `${headerHeight}px 0 0 ${headerWidth}px`} : {}}
        {...otherProps}
      >
        <div key="rows-before" style={{ height: rowsBeforeSize }} />
        <div key="real-cells" style={{ display: 'flex', flexDirection: 'row' }} >
          <div key="columns-before" style={{ minWidth: columnsBeforeSize }} />
          <div key="cells" style={{ tableLayout: 'fixed' }} >
            {cells /* flat array of calls of cellRenderer(), absolutely positioned */}
          </div>
          <div key="columns-after" style={{ minWidth: realColumns.after.size }} />
        </div>
        <div key="rows-after" style={{ height: realRows.after.size }} />

        {hasHeader &&
          <React.Fragment>
            {gridHeaderRenderer({
              style: {
                position: 'fixed', top: '0', left: '0', zIndex: '1000',
                height: `${headerHeight}px`, width: `${headerWidth}px`,
              },
            })}
            <div
              key="row-headers"
              style={{
                position: 'absolute', top: headerHeight, left: '0', zIndex: '900',
                height: '0',  // required so headers won't occupy all space with hight z-index
                width: `${scrollLeft + screenWidth}px`, // so headers never reach bottom of the it's contaiver
              }}
            >
              <div
                style={{
                  position: 'sticky', left: '0', width: '0',
                  // width for div not to occupy entire screen blocking grid underneath
                }}
              >
                {rowHeaders /* array of calls of rowHeaderRenderer() */}
              </div>
            </div>
            <div
              key="column-headers"
              style={{
                position: 'absolute', top: '0', left: headerWidth, zIndex: '900',
                height: `${scrollTop + screenHeight}px`,
                width: '0', // required so headers won't occupy all space with hight z-index
              }}
            >
              <div
                style={{
                  display: 'flex', flexDirection: 'row',
                  position: 'sticky', top: '0',
                }}
              >
                {columnHeaders /* array of calls of columnHeaderRenderer() */}
              </div>
            </div>
          </React.Fragment>
        }

        <div
          key="extra-width"
          style={{
            position: 'absolute', top: '0', left: '0', zIndex: '0',
            height: `calc(100vh + ${scrollTop}px + ${screenHeight}px + ${extraHeight})`,
            width: '1px', // "0px" don't work, if that and also scrollTop === 0 then extra space is tiny
          }}
        />
        <div
          key="extra-height"
          style={{
            position: 'absolute', top: '0', left: '0',
            height: '0',
            width: `calc(100vw + ${scrollLeft}px + ${screenWidth}px + ${extraWidth})`,
          }}
        />
      </div>
    );
  }
}

Grid.propTypes = propTypes;
Grid.defaultProps = defaultProps;

export default Grid;
export { getLineOffset } from './divideLinesByVisibility';
