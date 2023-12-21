import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import styles from './styles.module.css';

export function Carousel(props) {
    const { slideImages, ...p } = props;

    const spanStyle = {
        // padding: '20px',
        background: 'var(--ifm-hero-background-color)',
        color: 'var(--ifm-hero-text-color)',
        width: '100%',
        textAlign: 'center',
        display: 'block',
        borderRadius: '0 0 12px 12px'
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
                        <div style={{ ...divStyle}}>
                            <img src={slideImage.url} alt={slideImage.caption} style={{height: '100%'}} />
                        </div>
                        <span style={spanStyle}>{slideImage.caption}</span>
                    </div>
                ))}
            </Slide>
        </div>
    )
};