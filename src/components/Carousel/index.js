import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import styles from './styles.module.css';

export function Carousel(props) {
    const { slideImages, ...p } = props;

    const spanStyle = {
        // padding: '20px',
        background: '#efefef',
        color: '#000000',
        width: '100%',
        textAlign: 'center',
        display: 'block',
        // alignSelf: 'flex-end',
    }

    const divStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundSize: 'cover',
        height: '400px'
    }

    return (
        <div className={"slide-container" + " " + styles.reactSlideshowContainer}>
            <Slide autoplay={false} transitionDuration={250}>
                {slideImages.map((slideImage, index) => (
                    <div key={index}>
                        <div style={{ ...divStyle, 'backgroundImage': `url(${slideImage.url})` }}>
                        </div>
                        <span style={spanStyle}>{slideImage.caption}</span>
                    </div>
                ))}
            </Slide>
        </div>
    )
};