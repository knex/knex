import React from 'react'
import Heading from '../components/Heading'
import Code from '../components/Code'
import Text from '../components/Text'
import List from '../components/List'
import Method from '../components/Method'
import Runnable from '../components/Runnable'

export default function prepareTree(id, items) {
  return items.map((item, i) => {
    const props = { ...item, group: id, key: `${id}-${i}` }
    if (props.children) {
      props.children = prepareTree(id, props.children)
    }
    switch (item.type) {
      case 'heading': return <Heading {...props} />
      case 'code': return <Code {...props} />
      case 'method': return <Method {...props} />
      case 'runnable': return <Runnable {...props} />
      case 'list': return <List {...props} />
      case 'info':
      case 'text': return <Text {...props} />
    }
  })
}
