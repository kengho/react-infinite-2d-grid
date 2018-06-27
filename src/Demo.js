import React, { Component } from 'react';
import { throttle } from 'lodash';

import './Demo.css';
import Grid from './';

class Demo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scroll: {
        top: document.documentElement.scrollTop,
        left: document.documentElement.scrollLeft,
      },
    };

    // Don't waste your time optimizing this code, it just works.
    this.rows = [];
    this.columns = [];
    this.data = [];
    for (let i = 0; i < 100; i += 1) {
      let rowSize;
      if (i < 10) {
        rowSize = null;
      } else {
        rowSize = 50 - Math.floor(Math.random() * 20);
      }
      this.rows.push({ size: rowSize, key: i });
      this.data.push([]);
      for (let j = 0; j < 100; j += 1) {
        if (i === 0) {
          this.columns.push({ size: 100 - Math.floor(Math.random() * 30) });
        }
        this.data[i].push({ value: `${i}/${j}`, key: `${i}/${j}` });
      }
    }

    this.cellRenderer = this.cellRenderer.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
    this.gridHeaderRenderer = this.gridHeaderRenderer.bind(this);
    this.rowHeaderRenderer = this.rowHeaderRenderer.bind(this);
    this.columnHeaderRenderer = this.columnHeaderRenderer.bind(this);
  }

  // Modified code from here:
  //   https://stackoverflow.com/a/14901150/6376451
  onElementPropsChange(elem, props, timeout, callback) {
    let lastValues = props.map((prop) => elem[prop]);
    let newValues;

    const watchProp = () => {
      newValues = props.map((prop) => elem[prop]);
      newValues.some((newValue, index) => {
        const lastValue = lastValues[index];
        if (lastValue !== newValue) {
          callback(props[index], lastValue, newValue);
          return true;
        } else {
          return false;
        }
      });

      lastValues = newValues;

      if (elem.onElementPropsChangeTimer) {
        clearTimeout(elem.onElementPropsChangeTimer);
      }

      elem.onElementPropsChangeTimer = setTimeout(watchProp, timeout);
    };

    watchProp();
  }

  componentDidMount() {
    const windowResizeWatchTimeout = 1000;
    const scrollThrottleTimeout = 200;

    this.onElementPropsChange(
      window,
      ['innerHeight', 'innerWidth'],
      windowResizeWatchTimeout,
      (prop, lastValue, newValue) => {
        // console.log(`${prop} changed from ${lastValue} to ${newValue}`)
        this.setState({
          screen: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        });
      }
    );

    const onScroll = (evt) => {
      this.setState({
        scroll: {
          top: document.documentElement.scrollTop,
          left: document.documentElement.scrollLeft,
        },
      });
    };

    window.addEventListener('scroll', throttle(onScroll, scrollThrottleTimeout));
  }

  cellRenderer({
    rowIndex,
    columnIndex,
    style,
    isReal,
    isOnTopRow,
  }) {
    let childen;
    let key;
    if (isReal) {
      childen = this.data[rowIndex][columnIndex].value;
      key = this.data[rowIndex][columnIndex].key;
    } else {
      childen = `c${rowIndex}/c${columnIndex}`;
      key = childen;
    }

    return (
      <div
        className="cell"
        key={key}
        style={style}
      >
        {childen}
      </div>
    );
  }

  rowRenderer({
    index,
    cells,
    style,
    isReal,
  }) {
    let key;
    if (isReal) {
      key = this.rows[index].key;
    } else {
      key = index;
    }

    return (
      <div
        key={key}
        style={style}
      >
        {cells}
      </div>
    );
  }

  gridHeaderRenderer({ style }) {
    return <div style={{ ...style, backgroundColor: 'green' }} />;
  }

  rowHeaderRenderer({
    index,
    style,
  }) {
    let backgroundColor = 'blue';
    if (index % 2 === 0) {
      backgroundColor = 'red';
    }

    return (
      <div
        key={`row-header-${index}`}
        style={{ ...style, backgroundColor, color: 'white' }}
      >
        {index}
      </div>
    );
  }

  columnHeaderRenderer({
    index,
    style,
  }) {
    let backgroundColor = 'blue';
    if (index % 2 === 0) {
      backgroundColor = 'red';
    }

    return (
      <div
        key={`column-header-${index}`}
        style={{ ...style, backgroundColor, color: 'white' }}
      >
        {index}
      </div>
    );
  }

  render() {
    return (
      <Grid
        scrollTop={this.state.scroll.top}
        scrollLeft={this.state.scroll.left}
        screenHeight={this.state.screen.height}
        screenWidth={this.state.screen.width}
        rowsSizes={(i) => this.rows[i] ? this.rows[i].size : undefined}
        rowsNumber={this.rows.length}
        columnsSizes={(i) => this.columns[i] ? this.columns[i].size : undefined}
        columnsNumber={this.columns.length}
        defaultCellHeight={50}
        defaultCellWidth={90}
        spacing={2}
        gridRoundingLength={5}
        cellRenderer={this.cellRenderer}
        rowRenderer={this.rowRenderer}
        extraWidth={'200vw'}
        extraHeight={'200vh'}
        onSectionRendered={(linesDivision) => {}}
        hasHeader={true}
        headerHeight={20}
        headerWidth={30}
        gridHeaderRenderer={this.gridHeaderRenderer}
        rowHeaderRenderer={this.rowHeaderRenderer}
        columnHeaderRenderer={this.columnHeaderRenderer}
        onClick={() => console.log('you clicked on Grid!')}
      />
    );
  }
}

export default Demo;