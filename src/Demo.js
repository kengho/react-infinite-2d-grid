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
      hasHeader: true,
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
      // NOTE: PERF: rows with flex css is the same as just a bunch of
      //   absolutely positioned cells in terms of performance. Methodology:
      //   * take StandardBenchmark from here:
      //     https://ourcodeworld.com/articles/read/144/measuring-the-performance-of-a-function-with-javascript-using-browser-tools-or-creating-your-own-benchmark
      //   *run 100 iterations of this.setState

      // const b = StandardBenchmark(
      // () =>
      // console.time('onScroll');
      this.setState({
        scroll: {
          top: document.documentElement.scrollTop,
          left: document.documentElement.scrollLeft,
        },
      })
      // console.timeEnd('onScroll');
      // ,100
      // );
      // console.log(b.averageMillisecondsPerTask);
    };

    window.addEventListener('scroll', throttle(
      onScroll,
      scrollThrottleTimeout,
      { leading: false }
    ));
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

  gridHeaderRenderer({ style }) {
    return <div key="grid-header" style={{ ...style, backgroundColor: 'green' }} />;
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
      <React.Fragment>
        <Grid
          cellRenderer={this.cellRenderer}
          columnHeaderRenderer={this.columnHeaderRenderer}
          columnsNumber={this.columns.length}
          columnsSizes={(i) => this.columns[i] ? this.columns[i].size : undefined}
          defaultCellHeight={50}
          defaultCellWidth={90}
          extraHeight={'200vh'}
          extraWidth={'200vw'}
          gridHeaderRenderer={this.gridHeaderRenderer}
          gridRoundingLength={5}
          hasHeader={this.state.hasHeader}
          headerHeight={20}
          headerWidth={30}
          onClick={() => console.log('you clicked on Grid!')}
          onSectionRendered={(linesDivision) => {}}
          rowHeaderRenderer={this.rowHeaderRenderer}
          rowsNumber={this.rows.length}
          rowsSizes={(i) => this.rows[i] ? this.rows[i].size : undefined}
          screenHeight={this.state.screen.height}
          screenWidth={this.state.screen.width}
          scrollLeft={this.state.scroll.left}
          scrollTop={this.state.scroll.top}
          spacing={2}
        />
        <div className="toggle-has-header">
          <input
            type="checkbox"
            id="toggle-has-header"
            label="Has header"
            defaultChecked={this.state.hasHeader}
            onChange={() => this.setState({ hasHeader: !this.state.hasHeader })}
          />
          <label htmlFor="toggle-has-header">Has header?</label>
        </div>
      </React.Fragment>
    );
  }
}

export default Demo;
